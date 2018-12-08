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

function loadHTMLForURL(assignment) {
    return new Promise(function(resolve, reject) {
        (async () => {
            const crawler = await HCCrawler.launch({
                args: ['--no-sandbox'],
                evaluatePage: evaluateFunction,
                onSuccess: (result) => {
                    htmlLoadedFunction(result, assignment.htmlFilename, assignment.reportFilename);
                    resolve(assignment);
                }
            });
            await crawler.queue(assignment.url);
            await crawler.onIdle();
            await crawler.close();
        })();
    });
}

module.exports = { evaluateFunction, htmlLoadedFunction, loadHTMLForURL } ;
