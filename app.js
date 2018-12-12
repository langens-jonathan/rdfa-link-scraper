// express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// uuid
const uuid4 = require('uuid/v4');

// url
const url = require('url');

// scraper
const scraper =  require('./scraper/scraper');
const rdfaLinks = require('./scraper/rdfa-links-extractor');
const hrefLinks = require('./scraper/href-links-extractor');
const { process_link } = require('./scraper/process-links');

const PORT = process.env.PORT;
const MINIMUM_TIME_FOR_RESCRAPING = process.env.MINIMUM_TIME_FOR_RESCRAPING;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.post('/scrape', (req, res) => {
    let uuid = uuid4();
    let page_to_scrape = {
        url: req.body.url,
        uuid: uuid,
        filename: uuid + ".html",
        scraped: false,
        minimum_time_for_rescraping: MINIMUM_TIME_FOR_RESCRAPING
    };

    console.log("[!] Scraping page: " + page_to_scrape.url);

    let loadHTMLPromise = scraper.loadHTMLForURL(page_to_scrape);

    let baseUrl = url.parse(page_to_scrape.url, true);
    let basePath = baseUrl.protocol + "//" + baseUrl.host;

    // scrape RDFa links (rel)
    loadHTMLPromise.then(function(scraped_page) {
        // if the page was not scraped we shouldn't bother with trying to find links
        if(scraped_page.scraped) {
            rdfaLinks.extract_rdfa_links_from_file("/data/" + scraped_page.filename, basePath).then(function(links_found) {
                // do something with the discovered links
                console.log("[*] RDFa links found:");
                console.log(links_found);
                process_link_array(links_found, scraped_page);
            });
        }
    });

    // scrape HREF links
    loadHTMLPromise.then(function(scraped_page) {
        // if the page was not scraped we shouldn't bother with trying to find links
        if(scraped_page.scraped) {
            hrefLinks.extract_href_links_from_file("/data/" + scraped_page.filename, basePath).then(function(links_found) {
                console.log("[*] HREF links found:");
                console.log(links_found);
                process_link_array(links_found, scraped_page);
            });
        }
    });

    res.send(page_to_scrape);
});

async function process_link_array(links, configuration) {
    for(let index in links) {
        process_link(links[index], configuration);
        await sleep(10000);
    }
}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms);
    });
}

app.listen(PORT, () => console.log(`Scraper listening on port ${PORT}!`));
