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

  async imageProxyC(res, mimeType, url)
  {
    if ((mimeType) &&
         mimeType.includes('image'))
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
      }
    }

    return false;
  }

  async indexAsFeedC(res, tld, url)
  {
    if (url == tld)
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
      }
      catch(err)
      {
        console.log(err);
      }
    }

    return false;
  }

  async pageC(res, url, mimeType, feedProxy)
  {
    if ((mimeType) &&
         mimeType.includes('text/html'))
    {
      try
      {
        let data = null;
        let size = null;
        let pageObj = null;

        const response = await tools.rFetch(url);
        data = await response.arrayBuffer();
        data = Buffer.from(new Uint8Array(data));

        const encoding = chardet.detect(data);
        let decoder = new TextDecoder(encoding);
        data = decoder.decode(data);
        size = data.length;

        size = (size != null) ? parseInt(size / 1024) : 0;

        if ((size < this.prefs.overloadTreshold) ||
            (feedProxy == 'loadingConfirmed'))
        {
          pageObj = new Downcycler(url, this.prefs).get(data);
          if (pageObj.type == 'article')
          {
            console.log('processing request as downcycled article', url);
            data = new ArticleV(this.prefs).draw(pageObj);
          }
          else
          {
            console.log('processing request as downcycled page', url);
            data = new StrippedV(this.prefs).draw(pageObj);
          }

          tools.cLog(data);
          res.writeHead(200, {'Content-Type': mimeType});
          res.end(data);
        }
        else
        {
          console.log('processing request as overload warning');

          const metadataScraper = new MetadataScraper();
          const meta = await metadataScraper.get(url);
          tools.cLog('page metadata read', meta);

          const html = new OverloadWarningV(this.prefs).draw(url, meta, size);
          res.writeHead(200, {'Content-Type': mimeType});
          res.end(html);
        }

        return true;
      }
      catch (err)
      {
        console.log(err);
      }
    }

    return false;
  }

  async passthroughC(res, url, mimeType)
  {
    let bin = null;

    try
    {
      const response = await tools.rFetch(url);

      console.log('processing request as passthrough', url, mimeType);

      bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));
      res.writeHead(200, {'Content-Type': mimeType});
      res.end(bin, 'binary');

      return true;
    }
    catch (err)
    {
      console.log(err);
    }

    return false;
  }

  emptyC(res, url, mimeType)
  {
    try
    {
      console.log('processing as empty', url, mimeType);

      res.writeHead(200, {'Content-Type': mimeType});
      res.end('');

      return true;
    }
    catch (err)
    {
      console.log(err);
    }

    return false;
  }
}
