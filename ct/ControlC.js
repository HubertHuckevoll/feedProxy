import os                     from 'os';
import fs                     from 'fs';
import imgManip               from 'jimp';
import { JSDOM as dom }       from 'jsdom';
import * as feedExtractor     from '@extractus/feed-extractor'
import * as articleExtractor  from '@extractus/article-extractor'
import * as html5entities     from 'html-entities';
import iconvLite              from 'iconv-lite';

import { TsvImp }             from '../lb/TsvImp.js';
import { FeedSniffer }        from '../lb/FeedSniffer.js';
import { MetadataScraper }    from '../lb/MetadataScraper.js';
import { FeedReader }         from '../lb/FeedReader.js';
import { Preview }            from '../lb/Preview.js';
import { Transcode }          from '../lb/Transcode.js';
import { ImageProcessor }     from '../lb/ImageProcessor.js';

import { DowncycleV }         from '../vw/DowncycleV.js';
import { Html3V }             from '../vw/Html3V.js';

export class ControlC
{

  constructor(tools)
  {
    this.tools = tools;
    this.transcode = null;
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

    this.transcode = new Transcode(this.prefs, html5entities, iconvLite);
  }

  async passthroughC(res, url, feedProxy)
  {
    try
    {
      let bin = null;
      let size = null;
      const response = await this.tools.rFetch(url);
      const conType = response.headers.get("content-type");

      if (conType.includes('text/html'))
      {
        bin = await response.text();
        size = bin.length;
      }
      else
      {
        bin = await response.arrayBuffer();
        bin = Buffer.from(new Uint8Array(bin));
        size = bin.byteLength;
      }
      size = (size != null) ? parseInt(size / 1024) : 0;

      if ((size < this.prefs.overloadTreshold) ||
          (feedProxy == 'indexLoad'))
      {
        console.log('processing request as passthrough', url);

        if (conType.includes('text/html'))
        {
          console.log('downcycling html for', url);
          bin = await new DowncycleV(dom, this.tools, this.prefs, this.transcode).draw(bin);
          this.tools.log.log(bin);
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(bin);
        }
        else
        {
          console.log('passthrough as binary', url);
          res.writeHead(200, {'Content-Type': conType});
          res.end(bin, 'binary');
        }
      }
      else
      {
        console.log('processing request as overload warning');

        const metadataScraper = new MetadataScraper(dom, this.tools);
        const meta = await metadataScraper.get(url);
        this.tools.log.log('page metadata read', meta);

        const view = new Html3V(this.prefs, this.transcode);
        const html = view.drawOverloadWarning(url, meta, size);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
      }

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

      const bin = await new ImageProcessor(imgManip, this.prefs, this.tools).get(url);
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

  async tldC(res, url)
  {
    try
    {
      const feedSniffer = new FeedSniffer(this.rssHintTable, dom, this.tools);

      const feeds = await feedSniffer.get(url);
      console.log('feeds found', feeds);

      if (feeds.length > 0)
      {
        console.log('processing top level domain as feed', url);

        const feedReader = new FeedReader(feedExtractor, this.tools);
        const feed = await feedReader.get(feeds[0]);

        console.log('feed read successfully');
        this.tools.log.log(feed);

        const view = new Html3V(this.prefs, this.transcode);
        const html = view.drawArticlesForFeed(feed);

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);

        return true;
      }

      return false;
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
      console.log('processing page as preview', url);

      const pageObj = await new Preview(articleExtractor, this.tools).get(url);
      this.tools.log.log('returned preview object', pageObj);

      const view = new Html3V(this.prefs, this.transcode);
      const html = view.drawPreview(pageObj);
      this.tools.log.log('returned preview html', html);

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
