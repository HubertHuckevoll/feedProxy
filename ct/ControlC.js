import os                     from 'os';
import fs                     from 'fs';
import chardet                from 'chardet';

import * as tools             from '../lb/Tools.js';
import { TsvImp }             from '../lb/TsvImp.js';
import { FeedSniffer }        from '../lb/FeedSniffer.js';
import { MetadataScraper }    from '../lb/MetadataScraper.js';
import { FeedReader }         from '../lb/FeedReader.js';
import { ImageProcessor }     from '../lb/ImageProcessor.js';
import { Downcycler }         from '../lb/Downcycler.js';

import { OverloadWarningV }   from '../vw/OverloadWarningV.js';
import { StrippedV }          from '../vw/StrippedV.js';
import { FeedV }              from '../vw/FeedV.js';
import { ArticleV }           from '../vw/ArticleV.js';

export class ControlC
{

  constructor()
  {
    this.prefs = null;
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
    const rawTable = await tools.readFile(this.rssHintTableFile);
    this.rssHintTable = new TsvImp().fromTSV(rawTable);

    this.prefs = JSON.parse(await tools.readFile(this.prefsFile));
  }

  async pageC(res, url, feedProxy)
  {
    try
    {
      let bin = null;
      let size = null;
      let pageObj = null;
      const response = await tools.rFetch(url);
      const conType = response.headers.get("content-type");
      bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));
      size = bin.byteLength;

      if (conType.includes('text/html'))
      {
        const encoding = chardet.detect(bin);
        let decoder = new TextDecoder(encoding);
        bin = decoder.decode(bin);
        size = bin.length;
      }

      size = (size != null) ? parseInt(size / 1024) : 0;

      if ((size < this.prefs.overloadTreshold) ||
          (feedProxy == 'indexLoad'))
      {
        if (conType.includes('text/html'))
        {
          pageObj = new Downcycler(url, this.prefs).get(bin);
          if (pageObj.type == 'article')
          {
            console.log('processing request as downcycled article', url);
            bin = new ArticleV(this.prefs).draw(pageObj);
          }
          else
          {
            console.log('processing request as downcycled page', url);
            bin = new StrippedV(this.prefs).draw(pageObj);
          }

          tools.cLog(bin);
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(bin);
        }
        else
        {
          console.log('processing request as binary passthrough', url);
          res.writeHead(200, {'Content-Type': conType});
          res.end(bin, 'binary');
        }
      }
      else
      {
        console.log('processing request as overload warning');

        const metadataScraper = new MetadataScraper();
        const meta = await metadataScraper.get(url);
        tools.cLog('page metadata read', meta);

        const html = new OverloadWarningV(this.prefs).draw(url, meta, size);
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

  async imageProxyC(res, mimeType, url)
  {
    try
    {
      console.log('processing as image', url, mimeType);

      const bin = await new ImageProcessor(this.prefs).get(mimeType, url);
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

  async indexAsFeedC(res, url)
  {
    try
    {
      const feedSniffer = new FeedSniffer(this.rssHintTable);

      const feeds = await feedSniffer.get(url);
      console.log('feeds found', feeds);

      if (feeds.length > 0)
      {
        console.log('processing top level domain as feed', url);

        const feedReader = new FeedReader();
        const feed = await feedReader.get(feeds[0]);

        console.log('feed read successfully');
        tools.cLog(feed);

        const html = new FeedV(this.prefs).draw(feed);

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

  async articleC(res, url)
  {
    try
    {
      const resp = await tools.rFetch(url);
      let html = await resp.text();

      let pageObj = new Downcycler(url, this.prefs).get(html);
      if (pageObj.type == 'article')
      {
        console.log('processing request as rss linked article', url);
        html = new ArticleV(this.prefs).draw(pageObj);
      }
      else
      {
        console.log('processing request as rss linked downcycled page', url);
        html = new StrippedV(this.prefs).draw(pageObj);
      }
      tools.cLog('returned pure article html', html);

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
