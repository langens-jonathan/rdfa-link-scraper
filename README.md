# links scraper
This links scraper is intended to scrape links of an SPA web page.

## Usage
```
drc up -d
drc logs -f links-scraper
```
Then make a post call to
```
http://localhost8891/scrape/
```
with the body:
```
{
    "url": "https://publicatie.gelinkt-notuleren.demo.lblod.info"
}
```
and Content-Type set to application/json

After that the triple store (http://localhost:8890/sparql) will contain the scraped information of the websites and in the scraper-data folder there will be a downloaded version of each of the encountered pages.
