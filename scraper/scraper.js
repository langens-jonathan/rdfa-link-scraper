const fs = require('fs');
const puppeteer = require('puppeteer');

function htmlLoadedFunction(html, filename) {
    fs.writeFileSync("/data/" + filename, html);
    console.log("[*] HTML written to file " + filename + " .");
    // TODO save file and results in triple store
}

async function scrape_page(page_to_scrape) {
    const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: true});
    const page = await browser.newPage();
    await page.goto(page_to_scrape.url, {waitUntil: 'networkidle0'});
    const html = await page.content(); // serialized HTML of page DOM.
    await browser.close();
    page_to_scrape.html = html;
    return page_to_scrape;
}


function loadHTMLForURL(page_to_scrape) {
    let promise = new Promise(function(resolve, reject) {
        resolve(scrape_page(page_to_scrape));
    });
    promise.then(function(scraped_page) {
        htmlLoadedFunction(scraped_page.html, scraped_page.filename);
    });
    return promise;
}

module.exports = { loadHTMLForURL } ;
