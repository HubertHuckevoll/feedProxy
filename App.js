// foreign modules, heaven/hell
import * as http            from 'http';
import { JSDOM }            from 'jsdom';
import * as rssReader       from 'feed-reader';
import * as articleParser   from 'article-parser';
import * as html5entities   from 'html-entities';
import iconvLite            from 'iconv-lite';
import fetch                from 'node-fetch';
import Jimp                 from 'jimp';

// Our own modules
import { TsvImp }           from './lb/TsvImp.js';
import * as tools           from './lb/Tools.js';
import { FeedSniffer }      from './lb/FeedSniffer.js';
import { MetadataScraper }  from './lb/MetadataScraper.js';
import { Transcode }        from './lb/Transcode.js';
import { ControlC }         from './ct/ControlC.js';
import { Html3V }           from './vw/Html3V.js';


class App
{
  constructor(port)
  {
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.rssHintTableAddress = './privdata/feedProxySheet.csv';
    this.rssHintTable = null;

    this.blackListFile = './privdata/feedProxyBlacklist.csv';
    this.blackList = null;

    const transcode = new Transcode(html5entities, iconvLite);
    this.view = new Html3V(transcode);
    this.cntrl = new ControlC(tools);
  }

  async init()
  {
    const rawTable = await tools.readFile(this.rssHintTableAddress);
    this.rssHintTable = new TsvImp().fromTSV(rawTable);

    const rawBlacklist = await tools.readFile(this.blackListFile);
    this.blackList = new TsvImp().fromTSV(rawBlacklist);

    console.log('***feedProxy***');
    console.log('bound to '+hostname+':'+port);
    console.log('Public IP:', await tools.getPublicIP());
    console.log('Local IP:', tools.getLocalIP());
    console.log('Cobbled together by MeyerK 2022/10ff.');
    console.log('Running, waiting for requests (hit Ctrl+C to exit).');
  }

  logURL(url)
  {
    const prepend = 'REQUEST: ';
    console.log(prepend, url);
  }

  UrlIsInBlacklist(url)
  {
    let ret = false;
    this.blackList.forEach((entry) =>
    {
      if (url.includes(entry.service))
      {
        ret = true;
      }
    });

    return ret;
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
      if (this.UrlIsInBlacklist(url))
      {
        wasProcessed = await this.cntrl.passthroughC(request, response, url);
      }

      // image - proxy image, convert to GIF
      if ((wasProcessed === false) &&
          (await tools.isImage(url)))
      {
        wasProcessed = await this.cntrl.imageProxyC(Jimp, response, url);
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

const server = http.createServer(app.handler.bind(app));
server.listen(port, hostname, app.init.bind(app));