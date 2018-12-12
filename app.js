// express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// uuid
const uuid4 = require('uuid/v4');

// scraper
const scraper =  require('./scraper/scraper');
const rdfaLinks = require('./scraper/rdfa-links-extractor');

const PORT = process.env.PORT;
const MINIMUM_TIME_FOR_RESCRAPING = process.env.MINIMUM_TIME_FOR_RESCRAPING;

console.log(process.env);

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

    loadHTMLPromise.then(function(scraped_page) {
        rdfaLinks.extract_rdfa_links_from_file("/data/" + scraped_page.filename).then(function(links_found) {
            // do something with the discovered links
        });
    });

    res.send(page_to_scrape);
});

app.listen(PORT, () => console.log(`Scraper listening on port ${PORT}!`));
