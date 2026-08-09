## Target classification

**Site:** [Books to Scrape](https://books.toscrape.com)

**Why this site is appropriate to scrape:** the site states directly on its own homepage that it is a demo website built specifically for web scraping practice — "This is a demo website for web scraping purposes. Prices and ratings here were randomly assigned and have no real meaning." That is explicit permission from the site itself, and it is the only kind of target this project touches.

**Scope:** the first 3 catalogue pages only, and the individual book pages linked from them (60 books total). No other pages on the site are visited.

**robots.txt result:** `https://books.toscrape.com/robots.txt` returns a `404 Not Found`. No robots file exists. This is not treated as blanket permission — it simply means there are no crawl rules published for this site to check against.

**Data collected:** for each book — title, product URL, price, availability, star rating, description, and provenance fields (which catalogue page it came from, and when it was fetched).

I will not reuse this code on another site without checking its rules and terms first.