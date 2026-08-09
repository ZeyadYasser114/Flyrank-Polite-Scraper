const fs = require('fs');
fs.mkdirSync('cache', {recursive: true});
const CACHE_PATH = 'cache/catalogue-page-1.html';
const URL = 'https://books.toscrape.com/catalogue/page-1.html';

async function fetchPage() {
    if (fs.existsSync(CACHE_PATH)) {
       const html = fs.readFileSync(CACHE_PATH, 'utf-8');
       console.log('CACHE HIT ', html.length);
    } else {
    const response = await fetch(URL, {
        headers: { 'User-Agent': 'FlyRankInternshipA9/1.0 (+https://github.com/ZeyadYasser114/Flyrank-Polite-Scraper)' },
        signal: AbortSignal.timeout(5000)
    });
    console.log('Status:', response.status);
    const html = await response.text();
    fs.writeFileSync(CACHE_PATH, html);
    console.log('FETCH, size:', html.length);
}
}

fetchPage();