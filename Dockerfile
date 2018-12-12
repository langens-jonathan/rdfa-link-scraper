FROM node:11.3

# express.js dependencies
RUN yarn add express

RUN yarn add body-parser

# uuid.js
RUN yarn add uuid

# the node html parser
RUN yarn add node-html-parser

# jsdom.js
RUN yarn add jsdom

# headless-chrome-crawler.js dependencies
RUN yarn add puppeteer

RUN yarn add headless-chrome-crawler

RUN apt-get update && apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# copy the app
COPY . /app

WORKDIR /app

ENV PORT 3000
ENV MU_SPARQL_ENDPOINT 'http://database:8890/sparql'
ENV MU_APPLICATION_GRAPH 'http://mu.semte.ch/application'
ENV NODE_ENV 'production'
# the minimum age in seconds that need to have passed before a duplicate page will be added to the triple store
ENV MINIMUM_TIME_FOR_RESCRAPING 14400

CMD node app.js
