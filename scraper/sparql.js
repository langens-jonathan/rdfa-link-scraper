// SPARQL
const { query, update } = require('./mu/sparql');

const SPARQL = {
    PREFIXES: "PREFIX mu:<http://mu.semte.ch/vocabularies/> PREFIX muExt:<http://mu.semte.ch/vocabularies/ext/> PREFIX dct:<http://purl.org/dc/terms/> ",
    TYPE_PAGE: "muExt:Page",
    TYPE_DOWNLOADED_PAGE: "muExt:DownloadedPage",
    PREDICATE_URL: "muExt:url",
    PREDICATE_LINKSTO: "muExt:linksTo",
    PREDICATE_DOWNLOADEDAS: "muExt:downloadedAs",
    PREDICATE_FILENAME: "muExt:filename",
    PREDICATE_MODIFIED: "muExt:modified",
    PREDICATE_UUID: "mu:uuid",
    RESOURCE_BASE_PAGE: "http://example.com/resources/pages/",
    RESOURCE_BASE_DOWNLOADED_PAGE: "http://example.com/resources/downloaded-pages/",
    query: query,
    update: update
};

SPARQL.GRAPH = process.env.MU_APPLICATION_GRAPH;

module.exports = SPARQL;
