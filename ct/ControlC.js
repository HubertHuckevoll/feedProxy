import os                     from 'os';
import fs                     from 'fs';

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
         mimeType.includes('image') &&
        (mimeType != 'image/gif'))
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
      let html = null;
      html = await tools.rFetchText(url);

      const meta = await new MetadataScraper(url, html, this.prefs).get();

      if ((meta.isHTML5) || (this.prefs.downcycleEnableForHTML4 == true))
      {
        try
        {
          const feedSniffer = new FeedSniffer(this.rssHintTable);
          const feeds = await feedSniffer.get(url, html);

          if (feeds.length > 0)
          {
            console.log('processing top level domain as feed', url);
            console.log('page meta data', url, meta);
            console.log('feeds found', url, feeds);

            const feed = await new FeedReader().get(feeds[0]);

            console.log('feed read successfully');
            tools.cLog(feed);

            const html = new FeedV(this.prefs).draw(feed);
            tools.cLog(html);

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
    }

    return false;
  }

  async articleC(res, url, mimeType, feedProxy)
  {
    if (
        (mimeType && mimeType.includes('text/html')) &&
        ((feedProxy == 'lA') || (this.prefs.downcycleDetectReaderable == true))
       )
    {
      try
      {
        let html = null;
        html = await tools.rFetchText(url);

        const meta = await new MetadataScraper(url, html, this.prefs).get();
        const ds = new Downcycler(url, html, this.prefs);

        if (
             ((feedProxy == 'lA') || ds.isArticle()) &&
             ((meta.isHTML5) || (this.prefs.downcycleEnableForHTML4 == true))
           )
        {
          console.log('processing request as downcycled article', url);
          console.log('page meta data', url, meta);

          const pageObj = ds.getArticle();
          html = new ArticleV(this.prefs).draw(pageObj);

          tools.cLog(html);
          res.writeHead(200, {'Content-Type': mimeType});
          res.end(html);

          return true;
        }
      }
      catch (err)
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
        let html = null;
        html = await tools.rFetchText(url);
        const size = (html.length != null) ? parseInt(html.length / 1024) : 0;

        const meta = await new MetadataScraper(url, html, this.prefs).get();

        if ((meta.isHTML5) || (this.prefs.downcycleEnableForHTML4 == true))
        {
          if ((size < this.prefs.overloadTreshold) || (feedProxy == 'lP'))
          {
            console.log('processing request as downcycled page', url);
            console.log('page metadata read', url, meta);

            html = new Downcycler(url, html, this.prefs).getStrippedPage();
            html = new StrippedV(this.prefs).draw(html);

            tools.cLog(html);
            res.writeHead(200, {'Content-Type': mimeType});
            res.end(html);
          }
          else
          {
            console.log('processing request as overload warning', url);
            console.log('page metadata read', url, meta);

            html = new OverloadWarningV(this.prefs).draw(url, meta, size);
            res.writeHead(200, {'Content-Type': mimeType});
            res.end(html);
          }

          return true;
        }
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
    try
    {
      console.log('processing request as passthrough', url, mimeType);

      const fetchResponse = await tools.rFetch(url);
      fetchResponse.body.pipe(res);

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
