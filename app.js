// express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// uuid
const uuid4 = require('uuid/v4');

// scraper
const scraper =  require('./scraper/scraper');
const rdfaLinks = require('./scraper/rdfa-links-extractor');
const hrefLinks = require('./scraper/href-links-extractor');

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
        minimum_time_for_rescraping: MINIMUM_TIME_FOR_RESCRAPING
    };
    let loadHTMLPromise = scraper.loadHTMLForURL(page_to_scrape);

    // scrape RDFa links (rel)
    loadHTMLPromise.then(function(scraped_page) {
        rdfaLinks.extract_rdfa_links_from_file("/data/" + scraped_page.filename).then(function(links_found) {
            // do something with the discovered links
            console.log("RDFA Links found:");
            console.log(links_found);
        });
    });

    // scrape HREF links
    loadHTMLPromise.then(function(scraped_page) {
        hrefLinks.extract_href_links_from_file("/data/" + scraped_page.filename, scraped_page.url).then(function(links_found) {
            console.log("HREF Links found:");
            console.log(links_found);
        });
    });

    res.send(page_to_scrape);
});

app.listen(PORT, () => console.log(`Scraper listening on port ${PORT}!`));
