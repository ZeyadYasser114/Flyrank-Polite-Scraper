const fs = require('fs');
const cheerio = require('cheerio');
fs.mkdirSync('cache', {recursive: true});
const PAGE_URL = 'https://books.toscrape.com/catalogue/page-1.html';

async function fetchPage(url, cachePath) {
    let html;
    if (fs.existsSync(cachePath)) { 
       html = fs.readFileSync(cachePath, 'utf-8');
       console.log('CACHE HIT ', html.length);
    } else {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'FlyRankInternshipA9/1.0 (+https://github.com/ZeyadYasser114/Flyrank-Polite-Scraper)' },
            signal: AbortSignal.timeout(5000)
        });
        console.log('Status:', response.status);
        html = await response.text();
        fs.writeFileSync(cachePath, html);
        console.log('FETCH, size:', html.length);
    }

    const $ = cheerio.load(html);
    const links = [];
    $('article.product_pod h3 a').each((i, el) => {
        const href = $(el).attr('href');
        const absoluteUrl = new URL(href, url).href;
        links.push(absoluteUrl);
    });

    const nextHref = $('li.next a').attr('href');
    const nextUrl = nextHref ? new URL(nextHref, url).href : null;

    return { links, nextUrl };
}

async function run() {
    const allLinks = [];
    let currentUrl = PAGE_URL;
    let pageNum = 1;

    while (currentUrl && pageNum <= 3) {
        const cachePath = `cache/catalogue-page-${pageNum}.html`;
        const { links, nextUrl } = await fetchPage(currentUrl, cachePath);
        allLinks.push(...links);

        currentUrl = nextUrl;
        pageNum++;

        if (currentUrl) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    const uniqueLinks = [...new Set(allLinks)];
    console.log('catalogue_pages=' + (pageNum - 1));
    console.log('discovered=' + allLinks.length);
    console.log('unique_urls=' + uniqueLinks.length);
}

run();