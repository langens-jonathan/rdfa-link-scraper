// express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// uuid
const uuid4 = require('uuid/v4');

// scraper
const scraper =  require('./scraper/scraper');
const rdfaLinks = require('./scraper/rdfa-links-extractor');

const port = 3000; // default port

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.post('/scrape', (req, res) => {
    let uuid = uuid4();
    let page_to_scrape = {
        url: req.body.url,
        uuid: uuid,
        htmlFilename: uuid + ".html",
        reportFilename: uuid + ".report"
    };
    let loadHTMLPromise = scraper.loadHTMLForURL(page_to_scrape);

    loadHTMLPromise.then(function(scraped_page) {
        rdfaLinks.extract_rdfa_links_from_file("/data/" + scraped_page.htmlFilename).then(function(links_found) {
            // do something with the discovered links
        });
    });

    res.send(page_to_scrape);
});

app.listen(port, () => console.log(`Scraper listening on port ${port}!`));
