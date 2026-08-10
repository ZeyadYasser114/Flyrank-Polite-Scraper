const fs = require('fs');
const cheerio = require('cheerio');
const { z } = require('zod');
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

async function fetchBookDetail(url, cachePath, sourcePage) {
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
    
    const title = $('h1').text();
    const price_text = $('p.price_color').text();
    const availability_text = $('p.instock.availability').text().trim();

    const ratingClasses = $('p.star-rating').attr('class');
    const rating_text = ratingClasses.split(' ')[1];
    
    const description = $('#product_description + p').text() || null;
    const price_gbp = parseFloat(price_text.replace(/[^0-9.]/g, ''));
    return {
        title,
        product_url: url,
        price_text,
        price_gbp,
        availability_text,
        rating_text,
        description,
        source_page: sourcePage,
        fetched_at: new Date().toISOString()
    };

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
    const records = [];
    for (let i = 0; i < uniqueLinks.length; i++){
        const bookUrl = uniqueLinks[i];
        const cachePath = `cache/book-${i + 1}.html`;
        const record = await fetchBookDetail(bookUrl, cachePath, PAGE_URL);
        records.push(record)
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('detail_pages=' + records.length)

    const validRecords = [];
    const invalidRecords = [];
 for (let i = 0; i < records.length; i++) {
    const result = BookSchema.safeParse(records[i]);
    if (result.success){
        validRecords.push(result.data);
    }
    else{
        invalidRecords.push({record: records[i], reason: result.error.message});
    }

}

fs.mkdirSync('output', { recursive: true });

fs.writeFileSync('output/books.json', JSON.stringify(validRecords, null, 2));
fs.writeFileSync('output/errors.json', JSON.stringify(invalidRecords, null, 2));

console.log('valid=' + validRecords.length);
console.log('invalid=' + invalidRecords.length);
}
run();