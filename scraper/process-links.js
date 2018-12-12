var request = require('request');
const SPARQL = require('./sparql');
const uuid4 = require('uuid/v4');

async function process_link(link, configuration) {
    let result = await SPARQL.query(SPARQL.PREFIXES + "SELECT ?page_uri ?page_uuid WHERE { GRAPH <" +
                              SPARQL.GRAPH + "> { ?page_uri " +
                              SPARQL.PREDICATE_UUID + " ?page_uuid ; " +
                              SPARQL.PREDICATE_URL + " \"" + link + "\" . } }");

    let bindings = result.results.bindings;
    if(bindings.length > 1) {
        console.warn("[!] multiple page resources found for url: " + link);
    }
    if(bindings.length == 0) {
        // new page, saving it in the triple store
        var pageResourceUUID = uuid4();
        var pageResourceURI = SPARQL.RESOURCE_BASE_PAGE + pageResourceUUID;
        await SPARQL.query(SPARQL.PREFIXES + "INSERT DATA { GRAPH <" + SPARQL.GRAPH + "> { <" +
                  pageResourceURI + "> a " + SPARQL.TYPE_PAGE + " ; " +
                    SPARQL.PREDICATE_UUID + " \"" + pageResourceUUID + "\" ; " +
                    SPARQL.PREDICATE_URL + "\"" + link + "\" ." +
                    " } }");
    } else {
        var pageResourceUUID = bindings[0]["page_uuid"]["value"];
        var pageResourceURI = bindings[0]["page_uri"]["value"];
    }

    await SPARQL.query(SPARQL.PREFIXES + "INSERT DATA { GRAPH <" + SPARQL.GRAPH + "> { <" +
                       configuration.pageResourceURI + "> " +
                       SPARQL.PREDICATE_LINKSTO + " <" + pageResourceURI + "> . " +
                       " } }");
    request.post(
        'http://localhost:3000/scrape',
        { json: { url: link } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            } else {
                console.log("ERROR");
                console.log(error);
            }
        }
    );
}

module.exports = { process_link };
