// foreign modules, heaven/hell
import fs                   from 'fs';
import os                   from 'os';
import process              from 'process';
import * as http            from 'http';
import { JSDOM }            from 'jsdom';
import * as articleParser   from 'article-parser';
import * as html5entities   from 'html-entities';
import iconvLite            from 'iconv-lite';
//import fetch                from 'node-fetch';
import Jimp                 from 'jimp';

// Our own modules
import { TsvImp }           from './lb/TsvImp.js';
import * as tools           from './lb/Tools.js';
import { FeedSniffer }      from './lb/FeedSniffer.js';
import { MetadataScraper }  from './lb/MetadataScraper.js';
import { FeedReader }       from './lb/FeedReader.js';
import { Transcode }        from './lb/Transcode.js';
import { ControlC }         from './ct/ControlC.js';
import { Html3V }           from './vw/Html3V.js';

class App
{
  constructor(port, logging)
  {
    this.rssHintTable = null;
    this.blackList = null;
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.homedir = os.homedir()+'/.feedProxy/';

    tools.log.verbose = logging;

    this.rssHintTableFile = this.homedir+'feedProxySheet.csv';
    if (!fs.existsSync(this.rssHintTableFile))
    {
      this.rssHintTableFile = './config/feedProxySheet.csv';
    }

    this.blackListFile = this.homedir+'feedProxyBlacklist.csv';
    if (!fs.existsSync(this.blackListFile))
    {
      this.blackListFile = './config/feedProxyBlacklist.csv';
    }

    this.prefsFile = this.homedir+'prefs.json';
    if (!fs.existsSync(this.prefsFile))
    {
      this.prefsFile = './config/prefs.json';
    }
  }

  async init()
  {
    const rawTable = await tools.readFile(this.rssHintTableFile);
    this.rssHintTable = new TsvImp().fromTSV(rawTable);

    const rawBlacklist = await tools.readFile(this.blackListFile);
    this.blackList = new TsvImp().fromTSV(rawBlacklist);

    const prefs = JSON.parse(await tools.readFile(this.prefsFile));

    const transcode = new Transcode(prefs, html5entities, iconvLite);

    this.view = new Html3V(prefs, transcode);

    this.cntrl = new ControlC(prefs, tools);

    console.log('***feedProxy***');
    console.log('Bound to '+hostname+':'+port);
    console.log('Public IP:', await tools.getPublicIP());
    console.log('Local IP:', tools.getLocalIP());
    console.log('Verbose logging:', (tools.log.verbose === true) ? 'on' : 'off');
    console.log('Cobbled together by MeyerK 2022/10ff.');
    console.log('Running, waiting for requests (hit Ctrl+C to exit).');
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
        const feedReader = new FeedReader(tools);
        wasProcessed = await this.cntrl.feedContentC(this.view, feedReader, response, url);
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
const port = (process.argv[2] !== undefined) ? process.argv[2] : 8080;
const logging = (process.argv[3] == '-v') ? true : false;
const app = new App(port, logging);

const server = http.createServer(app.handler.bind(app));
server.listen(port, hostname, app.init.bind(app));