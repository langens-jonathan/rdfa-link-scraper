const fs = require('fs');
const HTMLParser = require('node-html-parser');

function is_link_block(block) {
    if(block.tagName === 'link') {
        return true;
    }
    if(!block.rawAttrs) {
        return false;
    }
    let split_attributes = block.rawAttrs.split(" ");
    for(attrIndex in split_attributes) {
        if(split_attributes[attrIndex].indexOf('href') > -1) {
            return true;
        }
    }
    return false;
}

function get_href_attribute(block) {
    let split_attributes = block.rawAttrs.split(" ");
    for(attrIndex in split_attributes) {
        if(split_attributes[attrIndex].indexOf('href') > -1) {
            return split_attributes[attrIndex].replace(new RegExp("href=", 'g'), "").replace(new RegExp("\"", 'g'), "");
        }
    }
    return undefined;
}

function check_ignore_file(link) {
    let blacklisttext = fs.readFileSync(process.env.BLACKLIST_FILE, "utf-8");
    let blacklist = blacklisttext.split(/\r?\n/);
    for(let index in blacklist) {
        let site = blacklist[index];
        if(link.indexOf(site) > -1) {
            console.log("[!] Site (" + link + ")is being skipped because of blacklist entry: " + site);
            return false;
        }
    }
    return true;
}

function is_valid_link(link) {
    if(link === "#") {
        return false;
    }
    if(link.endsWith(".css")) {
        return false;
    }
    if(!check_ignore_file(link)){
        return false;
    }
    return true;
}

function make_link_absolute(link, prefix) {
    if(link.startsWith("http")) {
        return link;
    }

    if(link.indexOf(prefix) > -1) {
        return link;
    }

    if(prefix.endsWith("/")) {
        prefix = prefix.slice(0, prefix.length - 1);
    }

    if(link.startsWith("/")) {
        link = link.slice(1, link.length);
    }

    return prefix + "/" + link;
}

function check_block(block, prefix) {
    let links_found = [];
    if(is_link_block(block)) {
        let link = get_href_attribute(block);
        if(is_valid_link(link)) {
            let absolute_link = make_link_absolute(link, prefix);
            links_found.push(absolute_link);
        }
    }

    if("childNodes" in block) {
        for(let cIndex in block["childNodes"]) {
            let child = block["childNodes"][cIndex];
            links_found = links_found.concat(check_block(child, prefix));
        }
    }
    return links_found;
}

function extract_href_links_from_file(filename, prefix) {
    return new Promise(function(resolve, reject) {
        let html = fs.readFileSync(filename, 'utf-8');
        let dom = HTMLParser.parse(html);
        let links_found = check_block(dom, prefix);
        resolve(links_found);
    });
}

module.exports = { extract_href_links_from_file };
