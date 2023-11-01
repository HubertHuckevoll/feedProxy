import os                     from 'os';
import fs                     from 'fs';
import chardet                from 'chardet';

import * as tools             from '../lb/Tools.js';
import { TsvImp }             from '../lb/TsvImp.js';
import { FeedSniffer }        from '../lb/FeedSniffer.js';
import { MetadataScraper }    from '../lb/MetadataScraper.js';
import { FeedReader }         from '../lb/FeedReader.js';
import { ArticleReader }      from '../lb/ArticleReader.js';
import { ImageProcessor }     from '../lb/ImageProcessor.js';

import { DowncycleV }         from '../vw/DowncycleV.js';
import { Html3V }             from '../vw/Html3V.js';

export class ControlC
{

  constructor()
  {
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
    const rawTable = await tools.readFile(this.rssHintTableFile);
    this.rssHintTable = new TsvImp().fromTSV(rawTable);

    this.prefs = JSON.parse(await tools.readFile(this.prefsFile));
  }

  async downcycleOrPassthroughOrOverloadC(res, url, feedProxy)
  {
    try
    {
      let bin = null;
      let size = null;
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
        console.log('processing request as downcycle/passthrough', url);

        if (conType.includes('text/html'))
        {
          console.log('downcycling html for', url);
          bin = await new DowncycleV(url, this.prefs).draw(bin);
          tools.cLog(bin);
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

        const metadataScraper = new MetadataScraper();
        const meta = await metadataScraper.get(url);
        tools.cLog('page metadata read', meta);

        const view = new Html3V(this.prefs);
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

        const view = new Html3V(this.prefs);
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

  async articleC(res, url)
  {
    try
    {
      console.log('processing page as article preview', url);

      const pageObj = await new ArticleReader().get(url);
      tools.cLog('returned article object', pageObj);

      const view = new Html3V(this.prefs);
      const html = view.drawArticle(pageObj);

      console.log(pageObj);

      tools.cLog('returned article html', html);

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
