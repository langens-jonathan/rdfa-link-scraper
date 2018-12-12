const fs = require('fs');
const { JSDOM } = require('jsdom');
const { analyse } = require('./marawa/rdfa-context-scanner');

function check_block(block) {
    let links_found = [];
    if("rdfaAttributes" in block) {
        console.log(block["rdfaAttributes"]);
        if("rel" in block["rdfaAttributes"] && block["rdfaAttributes"]["rel"] !== null) {
            links_found.add(block["rdfaAttributes"]["rel"]);
        }
    }
    if("children" in block) {
        for(let cIndex in block["children"]) {
            let child = block["children"][cIndex];
            links_found.concat(check_block(child));
        }
    }
    for(let blockIndex in block["richNode"]) {
        links_found.concat(check_block(block["richNode"][blockIndex]));
    }
    return links_found;
}

function extract_rdfa_links_from_file(filename) {
    return new Promise(function(resolve, reject) {
        let html = fs.readFileSync(filename, 'utf-8');
        let dom = new JSDOM(html);
        let analysis = analyse(dom.window.document.body);
        // I probably want to delete the bit below...
        let links_found = [];
        for(let block_index in analysis) {
            links_found.concat(check_block(analysis[block_index]));
        }
        resolve(links_found);
    });
}

module.exports = { extract_rdfa_links_from_file };
