import os                     from 'os';
import fs                     from 'fs';

import * as tools             from '../lb/Tools.js';
import { TsvImp }             from '../lb/TsvImp.js';
import { FeedSniffer }        from '../lb/FeedSniffer.js';

import { FeedReader }         from '../lb/FeedReader.js';
import { ImageProcessor }     from '../lb/ImageProcessor.js';
import { Downcycler }         from '../lb/Downcycler.js';
import { Markdowncycler }     from '../lb/Markdowncycler.js';

import { ImageV }             from '../vw/ImageV.js';
import { OverloadWarningV }   from '../vw/OverloadWarningV.js';
import { StrippedV }          from '../vw/StrippedV.js';
import { EmptyV }             from '../vw/EmptyV.js';
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

  async run(request, response, payload)
  {
    let wasProcessed = false;

    // image - proxy image, convert to GIF if not GIF yet
    if (wasProcessed === false)
    {
      wasProcessed = await this.imageProxyC(request, response, payload);
    }

    // Process top level domain as feed (if one exists)?
    if (wasProcessed === false)
    {
      wasProcessed = await this.indexAsFeedC(request, response, payload);
    }

    // process as overload warning?
    if (wasProcessed === false)
    {
      wasProcessed = await this.overloadC(request, response, payload);
    }

    // process as article?
    if (wasProcessed === false)
    {
      wasProcessed = await this.readerableC(request, response, payload);
    }

    // process as downcycle?
    if (wasProcessed === false)
    {
      wasProcessed = await this.strippedC(request, response, payload);
    }

    // if not processed, passthru - hopefully just big text files or binary downloads...
    if (wasProcessed === false)
    {
      wasProcessed = await this.passthroughC(request, response, payload);
    }

    // if still not processed (error...?): return empty, works best.
    if (wasProcessed === false)
    {
      wasProcessed = this.emptyC(request, response, payload);
    }
  }

  async imageProxyC(req, res, pl)
  {
    if (
          (pl.mimeType) &&
          (pl.mimeType.includes('image')) &&
          ((pl.mimeType != 'image/gif') || ((pl.mimeType == 'image/gif') && (this.prefs.imagesTreatGIFs == true)))
       )
    {
      try
      {
        console.log('processing original image', pl.url, pl.mimeType);

        const bin = await new ImageProcessor(this.prefs).get(pl.url);
        new ImageV(this.prefs).draw(res, bin);

        return true;
      }
      catch {}
    }

    return false;
  }

  async indexAsFeedC(req, res, pl)
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

            new FeedV(this.prefs).draw(res, pl.url, feed);

            return true;
          }
        }
        catch {}
      }
    }

    return false;
  }

  async overloadC(req, res, pl)
  {
    if ((pl.mimeType) && pl.mimeType.includes('text/html'))
    {
      if ((pl.size > this.prefs.overloadTreshold) && (pl.feedProxy != 'lP'))
      {
        try
        {
          console.log('processing request as overload warning', pl.url);

          new OverloadWarningV(this.prefs).draw(res, pl);

          return true;
        }
        catch {}
      }
    }

    return false;
  }

  async readerableC(req, res, pl)
  {
    if (
        (pl.mimeType && pl.mimeType.includes('text/html')) &&
        ((pl.feedProxy == 'lA') || (this.prefs.downcycleDetectReaderable == true))
       )
    {
      try
      {
        const ds = new Downcycler(pl.url, pl.html, this.prefs);

        if (
              ((pl.feedProxy == 'lA') || ds.isArticle()) &&
              ((pl.meta.isHTML5) || (this.prefs.downcycleEnableForHTML4 == true))
            )
        {
          console.log('processing request as downcycled article', pl.url);

          const pageObj = ds.getArticle();
          new ArticleV(this.prefs).draw(res, pl, pageObj);

          return true;
        }
      }
      catch {}
    }

    return false;
  }

  async strippedC(req, res, pl)
  {
    if ((pl.mimeType) && pl.mimeType.includes('text/html'))
    {
      if ((pl.meta.isHTML5) || (this.prefs.downcycleEnableForHTML4 == true))
      {
        try
        {
          console.log('processing request as downcycled page', pl.url);

          const html = new Downcycler(pl.url, pl.html, this.prefs).getStrippedPage();
          new StrippedV(this.prefs).draw(res, pl, html);

          return true;
        }
        catch {}
      }
    }

    return false;
  }

  async passthroughC(req, res, pl)
  {
    console.log('processing request as passthrough', pl.url, pl.mimeType);

    try
    {
      const fetchResponse = await tools.rFetchUrl(pl.url);
      fetchResponse.body.pipe(res);

      return true;
    }
    catch {}

    return false;
  }

  emptyC(req, res, pl)
  {
    console.log('processing as empty', pl.url, pl.mimeType);

    try
    {
      new EmptyV(this.prefs).draw(res);

      return true;
    }
    catch {}

    return false;
  }
}
