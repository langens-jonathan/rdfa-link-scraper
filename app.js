const scraper =  require('./scraper/scraper');
const rdfaLinks = require('./scraper/rdfa-links-extractor');
const express = require('express');
const app = express();
const port = 3000;
const uuid4 = require('uuid/v4');

let my_url = "http://www.google.com";

app.get('/', (req, res) => {
    let uuid = uuid4();
    let assignment = {
        url: my_url,
        uuid: uuid,
        htmlFilename: uuid + ".html",
        reportFilename: uuid + ".report"
    };
    let loadHTMLPromise = scraper.loadHTMLForURL(assignment);

    loadHTMLPromise.then(function(result) {
        rdfaLinks.extract_rdfa_links_from_file("/data/" + result.htmlFilename).then(function(analysis) {
            // do something with the analysis
        });
    });

    res.send(assignment);
});

app.listen(port, () => console.log(`Scraper listening on port ${port}!`));
