import os                     from 'os';
import fs                     from 'fs';

import * as tools             from '../lb/Tools.js';
import { TsvImp }             from '../lb/TsvImp.js';
import { FeedSniffer }        from '../lb/FeedSniffer.js';

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

  async imageProxyC(res, pl)
  {
    if ((pl.mimeType) &&
         pl.mimeType.includes('image') &&
        (pl.mimeType != 'image/gif'))
    {
      try
      {
        console.log('processing original image', pl.url, pl.mimeType);

        const bin = await new ImageProcessor(this.prefs).get(pl.url);
        if (this.prefs.imagesAsJpeg) {
          res.writeHead(200, {'Content-Type': 'image/jpeg'});
        } else {
          res.writeHead(200, {'Content-Type': 'image/gif'});
        }
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

  async indexAsFeedC(res, pl)
  {
    if (pl.url == pl.tld)
    {
      if ((pl.meta.isHTML5) || (this.prefs.downcycleEnableForHTML4 == true))
      {
        try
        {
          const feeds = await new FeedSniffer(pl.url, pl.html, this.rssHintTable).get();

          if (feeds.length > 0)
          {
            console.log('processing top level domain as feed', pl.url);
            console.log('feeds found', pl.url, feeds);

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

  async overloadC(res, pl, feedProxy)
  {
    if ((pl.mimeType) && pl.mimeType.includes('text/html'))
    {
      try
      {
        if ((pl.size > this.prefs.overloadTreshold) && (feedProxy != 'lP'))
        {
          console.log('processing request as overload warning', pl.url);

          const html = new OverloadWarningV(this.prefs).draw(pl.url, pl.meta, pl.size);

          res.writeHead(200, {'Content-Type': pl.mimeType});
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

  async readerableC(res, pl, feedProxy)
  {
    if (
        (pl.mimeType && pl.mimeType.includes('text/html')) &&
        ((feedProxy == 'lA') || (this.prefs.downcycleDetectReaderable == true))
       )
    {
      try
      {
        const ds = new Downcycler(pl.url, pl.html, this.prefs);

        if (
             ((feedProxy == 'lA') || ds.isArticle()) &&
             ((pl.meta.isHTML5) || (this.prefs.downcycleEnableForHTML4 == true))
           )
        {
          console.log('processing request as downcycled article', pl.url);

          const pageObj = ds.getArticle();
          const html = new ArticleV(this.prefs).draw(pageObj);

          tools.cLog(html);
          res.writeHead(200, {'Content-Type': pl.mimeType});
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

  async strippedC(res, pl)
  {
    if ((pl.mimeType) && pl.mimeType.includes('text/html'))
    {
      try
      {
        if ((pl.meta.isHTML5) || (this.prefs.downcycleEnableForHTML4 == true))
        {
          console.log('processing request as downcycled page', pl.url);

          let html = null;
          html = new Downcycler(pl.url, pl.html, this.prefs).getStrippedPage();
          html = new StrippedV(this.prefs).draw(html);

          tools.cLog(html);
          res.writeHead(200, {'Content-Type': pl.mimeType});
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

  async passthroughC(res, pl)
  {
    try
    {
      console.log('processing request as passthrough', pl.url, pl.mimeType);

      const fetchResponse = await tools.rFetch(pl.url);
      fetchResponse.body.pipe(res);

      return true;
    }
    catch (err)
    {
      console.log(err);
    }

    return false;
  }

  emptyC(res, pl)
  {
    try
    {
      console.log('processing as empty', pl.url, pl.mimeType);

      res.writeHead(200, {'Content-Type': pl.mimeType});
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
