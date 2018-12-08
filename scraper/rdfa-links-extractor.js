const { RdfaContextScanner, analyse } = require('./marawa/rdfa-context-scanner');
const {NodeWalker, walk} = require('./marawa/node-walker');
const fs = require('fs');
const HTMLParser = require('node-html-parser');
const { JSDOM } = require('jsdom');

function check_block(block) {
    if("rdfaAttributes" in block) {
        // console.log(block["rdfaAttributes"]);
        if("rel" in block["rdfaAttributes"] && block["rdfaAttributes"]["rel"] !== null) {
            console.log("NEW LINK!!");
            console.log(block["rdfaAttributes"]["rel"]);
        }
    }
    if("children" in block) {
        // console.log("has children");
        for(let cIndex in block["children"]) {
            let child = block["children"][cIndex];
            check_block(child);
        }
    }
    for(let blockIndex in block["richNode"]) {
        check_block(block["richNode"][blockIndex]);
    }
}

function extract_rdfa_links_from_file(filename) {
    return new Promise(function(resolve, reject) {
        let html = fs.readFileSync(filename, 'utf-8');
        var root = HTMLParser.parse(html);
        var dom = new JSDOM(html);
        let analysis = analyse(dom.window.document.body);
        // i probably want to delete the bit below...
        for(let block_index in analysis) {
            check_block(analysis[block_index]);
        }
        resolve(analysis);
    });
}

module.exports = { extract_rdfa_links_from_file };
