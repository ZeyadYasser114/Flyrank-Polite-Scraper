# Flyrank Polite Scraper

A small, polite scraping pipeline that downloads the first three catalogue pages of [Books to Scrape](https://books.toscrape.com), visits all 60 book pages, turns messy HTML into clean, schema-checked JSON records, survives a broken page without crashing, and ends every run with an honest report of what happened.

## Target classification

**Site:** [Books to Scrape](https://books.toscrape.com)

**Why this site is appropriate to scrape:** the site states directly on its own homepage that it is a demo website built specifically for web scraping practice — "This is a demo website for web scraping purposes. Prices and ratings here were randomly assigned and have no real meaning." That is explicit permission from the site itself, and it is the only kind of target this project touches.

**Scope:** the first 3 catalogue pages only, and the individual book pages linked from them (60 books total). No other pages on the site are visited.

**robots.txt result:** `https://books.toscrape.com/robots.txt` returns a `404 Not Found`. No robots file exists. This is not treated as blanket permission — it simply means there are no crawl rules published for this site to check against.

**Data collected:** for each book — title, product URL, price (raw text and normalized number), availability, star rating, description, and provenance fields (which catalogue page it came from, and when it was fetched).

I will not reuse this code on another site without checking its rules and terms first.

## Why no browser was needed

The data (titles, prices, ratings, descriptions) is already present in the raw HTML the server sends back on first request — nothing on these pages is loaded afterward via JavaScript. A headless browser (like Playwright) exists to run a page's JavaScript and wait for content to render; since there's nothing here that only appears after JavaScript runs, using one would only add startup cost and complexity with no benefit.

## Tech stack

- [Node.js](https://nodejs.org/) 20+
- Built-in `fetch` for HTTP requests
- [Cheerio](https://cheerio.js.org/) for HTML parsing
- [Zod](https://zod.dev/) for schema validation

## Getting started

### Prerequisites

- Node.js 20 or newer

### Install and run

```bash
git clone <repository-url>
cd Flyrank-Scraper
npm install
node src/index.js
```

That single command fetches (or reads from cache) the 3 catalogue pages, discovers all 60 book links, visits each book page, normalizes and validates every record, and writes the output files described below.

Re-running the same command is safe — cached pages are read from disk instead of re-requesting the live site, and the output files are overwritten with the same 60 records, not duplicated.

## Output

Running the scraper produces three files in `output/`:

- **`books.json`** — the 60 valid, schema-checked book records
- **`errors.json`** — any records that failed schema validation, each with the reason
- **`run-report.json`** — a summary of the run (see below)

## Record schema

Each valid record in `books.json` has this shape:

```json
{
  "title": "A Light in the Attic",
  "product_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "price_text": "£51.77",
  "price_gbp": 51.77,
  "availability_text": "In stock (22 available)",
  "rating_text": "Three",
  "description": "It's hard to imagine a world without A Light in the Attic. ...",
  "source_page": "https://books.toscrape.com/catalogue/page-1.html",
  "fetched_at": "2026-08-10T03:14:02.278Z"
}
```

Validated with [Zod](https://zod.dev/) against this schema:

```javascript
const BookSchema = z.object({
    title: z.string(),
    product_url: z.string().url(),
    price_text: z.string(),
    price_gbp: z.number(),
    availability_text: z.string(),
    rating_text: z.string(),
    description: z.string().nullable(),
    source_page: z.string().url(),
    fetched_at: z.string()
});
```

`price_gbp` is a normalized number derived from `price_text` (currency symbol stripped, parsed as a float) — the raw text is kept alongside it. `description` is `null`, never an invented value, when a book has none. Records that fail this schema are written to `errors.json` with the reason instead of being silently dropped or crashing the run.

## Politeness rules

Every real request to the site follows these rules:

- **Identifying user-agent** — every request sends `FlyRankInternshipA9/1.0 (+https://github.com/ZeyadYasser114/Flyrank-Polite-Scraper)`, naming the script and linking back to this repo.
- **Timeout** — every request gives up after 5 seconds rather than hanging indefinitely.
- **Status check** — only a `200` response is treated as a successful page; anything else is a failed fetch, not HTML to parse.
- **Delay** — the script waits at least 500ms between real (non-cached) requests to the site.
- **Cache** — every fetched page (catalogue and book detail) is saved to `cache/` on first request. Every subsequent run reads from that saved copy instead of asking the site again. The site is asked for each page at most once across the life of this project.

## Failure handling

Each book page is fetched independently inside its own `try/catch`. If one page fails (network error, timeout, unexpected page shape), it is logged and skipped — the rest of the run continues and the good records are still written. Every failure is recorded in `run-report.json`'s `failed_pages` count.

This was verified by deliberately adding one fake, nonexistent book URL to the list and confirming the run still finished with all 60 real records intact and `failed_pages: 1` reported.

## Example run report

```json
{
  "start_time": "2026-08-10T03:14:02.278Z",
  "duration_ms": 32466,
  "pages_fetched": 3,
  "detail_pages_fetched": 60,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```

## Known limitations

- `source_page` on every book record currently points to catalogue page 1, rather than the specific page (1, 2, or 3) each book actually appeared on.
- Failed pages are logged and skipped, but not automatically retried — a `5xx` or timeout failure is treated the same as a permanent one (`404`/`403`). Proper retry logic with backoff is deliberately left for a later assignment, per this project's scope.

## Ethics note

This project only scrapes a site explicitly built and labeled for scraping practice. In general: an official API is used instead of scraping whenever one exists; logins, paywalls, and access blocks are never bypassed; and only the data actually needed is collected, at a deliberately slow, identifiable, cache-first pace so as not to burden the target site.