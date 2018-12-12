const HCCrawler = require('headless-chrome-crawler');
const fs = require('fs');

function evaluateFunction() {
    return(document.body.innerHTML);
}

function htmlLoadedFunction(result, htmlFilename, reportFilename) {
    console.log("[*] HTML structure loaded");
    fs.writeFileSync("/data/" + htmlFilename, result.result);
    fs.writeFileSync("/data/" + reportFilename, result);
    console.log("[*] HTML written to file " + htmlFilename + " .");
    console.log("[*] Report written to file " + reportFilename + " .");
    // TODO save file and results in triple store
}

function loadHTMLForURL(page_to_scrape) {
    return new Promise(function(resolve, reject) {
        (async () => {
            const crawler = await HCCrawler.launch({
                args: ['--no-sandbox'],
                evaluatePage: evaluateFunction,
                onSuccess: (result) => {
                    htmlLoadedFunction(result, page_to_scrape.htmlFilename, page_to_scrape.reportFilename);
                    resolve(page_to_scrape);
                }
            });
            await crawler.queue(page_to_scrape.url);
            await crawler.onIdle();
            await crawler.close();
        })();
    });
}

module.exports = { evaluateFunction, htmlLoadedFunction, loadHTMLForURL } ;
