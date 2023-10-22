import os                   from 'os';
import fs                   from 'fs';
import Jimp                 from 'jimp';
import { JSDOM }            from 'jsdom';
import { extractFromXml }   from '@extractus/feed-extractor'
import * as articleParser   from 'article-parser';
import * as html5entities   from 'html-entities';
import iconvLite            from 'iconv-lite';

import { TsvImp }           from '../lb/TsvImp.js';
import { FeedSniffer }      from '../lb/FeedSniffer.js';
import { MetadataScraper }  from '../lb/MetadataScraper.js';
import { FeedReader }       from '../lb/FeedReader.js';
import { Preview }          from '../lb/Preview.js';
import { Transcode }        from '../lb/Transcode.js';
import { ImageProcessor }   from '../lb/ImageProcessor.js';

import { Html3V }           from '../vw/Html3V.js';

export class ControlC
{

  constructor(tools)
  {
    this.tools = tools;
    this.rssHintTable = null;
    this.homedir = os.homedir()+'/.feedProxy/';

    this.rssHintTableFile = this.homedir+'feedProxySheet.csv';
    if (!fs.existsSync(this.rssHintTableFile))
    {
      this.rssHintTableFile = './config/feedProxySheet.csv';
    }

    this.prefsFile = this.homedir+'prefs.json';
    if (!fs.existsSync(this.prefsFile))
    {
      this.prefsFile = './config/prefs.json';
    }
  }

  async init()
  {
    const rawTable = await this.tools.readFile(this.rssHintTableFile);
    this.rssHintTable = new TsvImp().fromTSV(rawTable);

    this.prefs = JSON.parse(await this.tools.readFile(this.prefsFile));

    const transcode = new Transcode(this.prefs, html5entities, iconvLite);

    this.view = new Html3V(this.prefs, transcode);
  }

  async passthroughC(req, res, url)
  {
    try
    {
      console.log('processing as passthrough', url);
      let bin = null;
      const response = await this.tools.rFetch(url);
      const conType = response.headers.get("content-type");

      bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));

      res.writeHead(200, {'Content-Type': conType});
      res.end(bin);

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  async imageProxyC(res, url)
  {
    try
    {
      console.log('processing as image', url);

      const bin = await new ImageProcessor(Jimp, this.prefs, this.tools).get(url);
      res.writeHead(200, {'Content-Type': 'image/gif'});
      res.end(bin, 'binary');

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  async feedContentC(res, url)
  {
    try
    {
      console.log('processing as feed content', url);

      const feedReader = new FeedReader(extractFromXml, this.tools);
      const feed = await feedReader.get(url);

      console.log('feed read successfully');

      const html = this.view.drawArticlesForFeed(feed);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch(err)
    {
      console.log(err);
      return false;
    }
  }

  async overviewC(res, url)
  {
    try
    {
      console.log('processing as overview', url);

      const feedSniffer = new FeedSniffer(this.rssHintTable, JSDOM, this.tools);
      const metadataScraper = new MetadataScraper(JSDOM, this.tools);

      const feeds = await feedSniffer.get(url);
      console.log('feeds found', feeds);

      const meta = await metadataScraper.get(url);
      console.log('page metadata read', meta);

      const html = this.view.drawOverview(url, meta, feeds);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch(err)
    {
      console.log(err);
      return false;
    }
  }

  async previewC(res, url)
  {
    try
    {
      console.log('processing as preview', url);

      const pageObj = await new Preview(articleParser, this.tools).get(url);
      const html = this.view.drawPreview(pageObj);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  emptyC(res, url)
  {
    try
    {
      console.log('processing as empty', url);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('');

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

}
