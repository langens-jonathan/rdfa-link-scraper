# Breadcrumbs branch
The main addition to the scraper with the breadcrumbs can be found in:
* app.js
* scraper/scraper.js

## scraper/scraper.js
In the main program loop the addition can be found here:
```
 async function scrape_page(page_to_scrape) {
     const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: true});
     const page = await browser.newPage();
     await page.goto(page_to_scrape.url, {waitUntil: 'networkidle0'});
+
+    let page_content = await page.content();
+    for(let bcindex in page_to_scrape.breadcrumbs) {
+        let breadcrumb = page_to_scrape.breadcrumbs[bcindex];
+        await clickOnLink(page, breadcrumb);
+    }
+
     const html = await page.content(); // serialized HTML of page DOM.
     await browser.close();
     page_to_scrape.html = html;
```
Now we call a clink on link function for each "breadcrumb" that we get passed. This breadcrumbs array is of the form:
```
[
"http://url1.com/.../",
"http://url2.com/.../"
]
```
The idea is that each of this links will be unique (they don't need to be URLs, the name of a button should also work as we just ask puppeteer to click it).
For each of those we will then click them and wait. This will allow us to navigate through a set of pages and get the needed info.

The function that performs the clicking is rather simple, it just asks puppeteer to click on the first object that has an href attribute for which that attribute matches the value in the breadcrumb:
```
async function clickOnLink(page, link) {
    const linkHandlesArray = await page.$x('//a');
    const linkHandlers = await Promise.all(linkHandlesArray.map(async (handle) => {
        let url = await handle.getProperty('href');
        return {
            url: url,
            handle: handle
        };
    }));

    for(let index in linkHandlers) {
        let handler = linkHandlers[index];
        let href = await handler.url.jsonValue();
        if(href.indexOf(link) > -1) {
            await handler.handle.click();
            await page.waitForNavigation({waitUntil: 'networkidle0'});
        }
    }
}
```

## app.js
The changes here are not finished. At this point there are 2 possible options. Or we make the call with all breadcrumbs in the request body. This seems to be the less desirable option though as it limits the possibility to detect circular scraping. The other option is to store the found link together with the breadcrumb array in the database. This option does not automatically solve the circularity but allows for inspecting the breadcrumbs and deciding to ignore the newly found link.

The scraper now expects an extra key in the page_to_scrape hash; namely an array (breadcrumbs) with simple string representations of the objects to click on. At first I used id's (this can be done by replacing the handle.getProperty(href) to handle.getProperty(id) in the scraper) but this doesn't always work as id's are not always stable. Sometimes part of it is used for mark up and it is not clear which part etc. Then the scraper will start from this page and click on all links in sequence. This means that if you got to this page with the following info:
```
base url: "http://example",
breadcrumbs: [
  "http://example/1",
  "google.com/bla"
]
```
And you found the link: "http://links.com/2" on this page that in order to scrape that page that that leads to you would just need:
```
base url: "http://example",
breadcrumbs: [
  "http://example/1",
  "google.com/bla",
  "http://links.com/2"
]
```
I started on this implementation but did not finish it. There are clear roadblocks still as indicated earlier with the circularity for instance.

# Scraper
This links scraper is intended to scrape links of an SPA web page.
## Usage
```
drc up -d
drc logs -f links-scraper
```
Then make a post call to
```
http://localhost8891/scrape/
```
with the body:
```
{
    "url": "https://publicatie.gelinkt-notuleren.demo.lblod.info"
}
```
and Content-Type set to application/json

After that the triple store (http://localhost:8890/sparql) will contain the scraped information of the websites and in the scraper-data folder there will be a downloaded version of each of the encountered pages.
