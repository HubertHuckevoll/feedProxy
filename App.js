import * as http            from 'http';
import { TsvImp }           from './_l/TsvImp.js';
import * as tools           from './_l/Tools.js';
import { FeedSniffer }      from './_l/FeedSniffer.js';
import { MetadataScraper }  from './_l/MetadataScraper.js';
import { ControlC }         from './_c/ControlC.js';
import { Html3V }           from './_v/Html3V.js';
import { JSDOM }            from 'jsdom';
import * as rssReader       from 'feed-reader';
import * as articleParser   from 'article-parser';
import * as html5entities   from 'html-entities';
import { Transcode }        from './_l/Transcode.js';
import iconvLite            from 'iconv-lite';

class App
{
  constructor(port)
  {
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.rssHintTableAddress = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTToY09sxeo57zbb-5hXF7ElwI6NaDACTWx_itnF4yVV9j1V_s-H3FTCKP8a17K22tzLFazhCcO82uL/pub?output=tsv';
    this.rssHintTable = null;

    const transcode = new Transcode(html5entities, iconvLite);
    this.view = new Html3V(transcode);
    this.cntrl = new ControlC();
  }

  async init()
  {
    const res = await fetch(this.rssHintTableAddress);
    if (res.ok)
    {
      const rawTable = await res.text();
      this.rssHintTable = new TsvImp().fromTSV(rawTable);
    }
  }

  logURL(url)
  {
    let line = '';
    const prepend = 'URL (reworked): ';
    line = line.padStart((prepend.length + url.length + 1), '_');
    console.log(line);
    console.log(prepend, url);
  }

  async handler(request, response)
  {
    let url = request.url;
    let tld = '';

    const referer = request.headers['referer'];
    let wasProcessed = false;

    if (!url.includes('favicon.ico'))
    {
      url = tools.reworkURL(this.pAdress, url);
      tld = tools.tldFromUrl(url);
      this.logURL(url);

      // passthrough
      if (url.includes('geos-infobase')) //FIXME: add mode for viewing original page
      {
        wasProcessed = await this.cntrl.passthroughC(request, response, url);
      }

      // image - proxy image, convert to to GIF
      if ((wasProcessed === false) &&
          (await tools.isImage(url)))
      {
        wasProcessed = await this.cntrl.imageProxyC(response, url);
      }

      // RSS - show feed content
      if ((wasProcessed === false) &&
          (await tools.isRss(url)))
      {
        wasProcessed = await this.cntrl.feedContentC(this.view, rssReader, response, url);
      }

      // "homepage" - show overwiew
      if ((wasProcessed === false) &&
          (url == tld))
      {
        const fs = new FeedSniffer(this.rssHintTable, JSDOM, tools);
        const ms = new MetadataScraper(JSDOM, tools);
        wasProcessed = await this.cntrl.overviewC(this.view, fs, ms, response, url);
      }

      // referer is RSS - show article extract
      if ((wasProcessed === false) &&
          (await tools.isRss(referer)))
      {
        wasProcessed = await this.cntrl.previewC(this.view, articleParser, response, url);
      }
    }

    // is something else: return empty (works best...)
    if (wasProcessed === false)
    {
      wasProcessed = this.cntrl.emptyC(response);
    }
  }
}

const hostname = '0.0.0.0';
const port = 8080;
const app = new App(port);
await app.init();

const server = http.createServer(app.handler.bind(app));
server.listen(port, hostname, () =>
{
  console.log('***feedProxy***');
  console.log('running at http://'+hostname+':'+port+'/');
});