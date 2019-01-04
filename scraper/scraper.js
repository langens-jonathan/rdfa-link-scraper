const fs = require('fs');
const puppeteer = require('puppeteer');
const uuid4 = require('uuid/v4');
const SPARQL = require('./sparql');

/*
 loadHTMLForURL
 This function is the only one that get exported
 */
async function loadHTMLForURL(page_to_scrape) {
    // first we check if we need to scrape the page
    let scrape_check = await check_if_scraping_is_needed(page_to_scrape);
    if(scrape_check.scrapingIsNeeded === true) {
        // if needed then we return a promise that will obtain the HTML first
        page_to_scrape.pageResourceURI = scrape_check.pageResourceURI;
        page_to_scrape.pageResourceUUID = scrape_check.pageResourceUUID;
        let promise = new Promise(function(resolve, reject) {
            resolve(scrape_page(page_to_scrape));
        });
        promise.then(function(scraped_page) {
            htmlLoadedFunction(scraped_page);
        });
        return promise;
    } else {
        // Otherwise a simple yes promise
        return new Promise(function(resolve, reject) {
            resolve(page_to_scrape);
        });
    }
}

function htmlLoadedFunction(page_to_scrape) {
    fs.writeFileSync("/data/" + page_to_scrape.filename, page_to_scrape.html);
    console.log("[*] HTML written to file " + page_to_scrape.filename + " .");
    // save file and results in triple store
    var pageResourceURI = SPARQL.RESOURCE_BASE_DOWNLOADED_PAGE + page_to_scrape.uuid;
    SPARQL.query(SPARQL.PREFIXES + "INSERT DATA { GRAPH <" + SPARQL.GRAPH + "> { <" +
                 page_to_scrape.pageResourceURI + "> " + SPARQL.PREDICATE_DOWNLOADEDAS + "<" +
                 pageResourceURI + "> . <" +
                 pageResourceURI + "> a " + SPARQL.TYPE_DOWNLOADED_PAGE + " ; " +
                 SPARQL.PREDICATE_UUID + " \"" + page_to_scrape.uuid + "\" ; " +
                 SPARQL.PREDICATE_MODIFIED + " \"" + new Date() + "\" ; " +
                 SPARQL.PREDICATE_FILENAME + "\"" + page_to_scrape.filename + "\" ." +
                 " } }");
}

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

async function scrape_page(page_to_scrape) {
    const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: true});
    const page = await browser.newPage();
    await page.goto(page_to_scrape.url, {waitUntil: 'networkidle0'});

    let page_content = await page.content();
    for(let bcindex in page_to_scrape.breadcrumbs) {
        let breadcrumb = page_to_scrape.breadcrumbs[bcindex];
        await clickOnLink(page, breadcrumb);
    }

    const html = await page.content(); // serialized HTML of page DOM.
    await browser.close();
    page_to_scrape.html = html;
    page_to_scrape.scraped = true;
    return page_to_scrape;
}

/**
 Check if scraping is needed
 This is a pretty big function in terms of lines. What it does however is simply check
 if the page with the url in page_to_scrape has already been scraped.

 To do that we ensure that there is a resource for the page in the triple store and then
 we load all the downloaded version of this page. If the newest one is older than the minimum
 time before we rescrape (see environment vars for this service) or there is no downloaded
 version of this page then we scrape it.
 */
async function check_if_scraping_is_needed(page_to_scrape) {
    let result = await SPARQL.query(SPARQL.PREFIXES + "SELECT ?page_uri ?page_uuid WHERE { GRAPH <" +
                              SPARQL.GRAPH + "> { ?page_uri " +
                              SPARQL.PREDICATE_UUID + " ?page_uuid ; " +
                              SPARQL.PREDICATE_URL + " \"" + page_to_scrape.url + "\" . } }");

    let bindings = result.results.bindings;
    if(bindings.length > 1) {
        console.warn("[!] multiple page resources found for url: " + page_to_scrape.url);
    }
    if(bindings.length == 0) {
        // new page, saving it in the triple store
        var pageResourceUUID = uuid4();
        var pageResourceURI = SPARQL.RESOURCE_BASE_PAGE + pageResourceUUID;
        await SPARQL.query(SPARQL.PREFIXES + "INSERT DATA { GRAPH <" + SPARQL.GRAPH + "> { <" +
                  pageResourceURI + "> a " + SPARQL.TYPE_PAGE + " ; " +
                    SPARQL.PREDICATE_UUID + " \"" + pageResourceUUID + "\" ; " +
                    SPARQL.PREDICATE_URL + "\"" + page_to_scrape.url + "\" ." +
                    " } }");
    } else {
        var pageResourceUUID = bindings[0]["page_uuid"]["value"];
        var pageResourceURI = bindings[0]["page_uri"]["value"];
    }

    let downloaded_pages_result = await SPARQL.query(SPARQL.PREFIXES + "SELECT ?downloaded_page_uri ?downloaded_page_uuid ?downloaded_page_last_modified" +
                                                " WHERE { GRAPH <" + SPARQL.GRAPH + "> { " +
                                                "<" + pageResourceURI + "> " + SPARQL.PREDICATE_DOWNLOADEDAS + " ?downloaded_page_uri . " +
                                                "?downloaded_page_uri " + SPARQL.PREDICATE_UUID + " ?downloaded_page_uuid ; " +
                                                SPARQL.PREDICATE_MODIFIED + " ?downloaded_page_last_modified . } } " +
                                                     "ORDER BY DESC(?downloaded_page_last_modified) LIMIT 1");
    let downloaded_pages = downloaded_pages_result.results.bindings;
    if(downloaded_pages.length === 0) {
        return {
            "scrapingIsNeeded": true,
            "pageResourceUUID" : pageResourceUUID,
            "pageResourceURI": pageResourceURI
        };
    } else {
        let last_modified = new Date(downloaded_pages[0]["downloaded_page_last_modified"]["value"]);
        let time_passed_since_last_scrape = new Date() - last_modified;
        if(page_to_scrape.minimum_time_for_rescraping > -1 &&
           time_passed_since_last_scrape > page_to_scrape.minimum_time_for_rescraping) {
            return {
                "scrapingIsNeeded": true,
                "pageResourceUUID" : pageResourceUUID,
                "pageResourceURI": pageResourceURI
            };
        } else {
            return {
                "scrapingIsNeeded": false,
                "pageResourceUUID" : pageResourceUUID,
                "pageResourceURI": pageResourceURI
            };
        }
    }
}

module.exports = { check_if_scraping_is_needed, loadHTMLForURL } ;
