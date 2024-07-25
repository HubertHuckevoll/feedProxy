import * as tools             from '../lb/Tools.js';
import { FeedSniffer }        from '../lb/FeedSniffer.js';

import { FeedReader }         from '../lb/FeedReader.js';
import { ImageProcessor }     from '../lb/ImageProcessor.js';
import * as downcycling       from '../lb/Downcycling.js';

import { ImageV }             from '../vw/ImageV.js';
import { OverloadWarningV }   from '../vw/OverloadWarningV.js';
import { StrippedV }          from '../vw/StrippedV.js';
import { EmptyV }             from '../vw/EmptyV.js';
import { FeedV }              from '../vw/FeedV.js';
import { ArticleV }           from '../vw/ArticleV.js';

export class ControlC
{
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
          ((pl.mimeType != 'image/gif') || ((pl.mimeType == 'image/gif') && (globalThis.prefs.imagesTreatGIFs == true)))
       )
    {
      try
      {
        console.log('processing original image', pl.url, pl.mimeType);

        const bin = await new ImageProcessor().get(pl.url);
        new ImageV().draw(res, bin);

        return true;
      }
      catch {}
    }

    return false;
  }

  async indexAsFeedC(req, res, pl)
  {
    if (
         (globalThis.prefs.feedDetectionEnabled) &&
         (pl.url == pl.tld) &&
         (pl.meta.isHTML5) || (globalThis.prefs.downcycleEnableForHTML4 == true)
       )
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

          new FeedV().draw(res, pl.url, feed);

          return true;
        }
      }
      catch {}
    }

    return false;
  }

  async overloadC(req, res, pl)
  {
    if (
         (pl.mimeType && pl.mimeType.includes('text/html')) &&
         (pl.size > globalThis.prefs.overloadTreshold) &&
         (pl.feedProxy != 'lP')
       )
    {
      try
      {
        console.log('processing request as overload warning', pl.url);

        new OverloadWarningV().draw(res, pl);

        return true;
      }
      catch {}
    }

    return false;
  }

  async readerableC(req, res, pl)
  {
    if (
        (pl.mimeType && pl.mimeType.includes('text/html')) &&
        ((pl.feedProxy == 'lA') || (globalThis.prefs.downcycleDetectReaderable == true)) &&
        (pl.meta.isHTML5) || (globalThis.prefs.downcycleEnableForHTML4 == true)
       )
    {
      try
      {
        if (downcycling.isArticle(pl.url, pl.html))
        {
          console.log('processing request as downcycled article', pl.url);

          const pageObj = downcycling.getArticle(pl.url, pl.html);
          new ArticleV().draw(res, pl, pageObj);

          return true;
        }
      }
      catch {}
    }

    return false;
  }

  async strippedC(req, res, pl)
  {
    if (
         (pl.mimeType && pl.mimeType.includes('text/html')) &&
         (pl.meta.isHTML5 || (globalThis.prefs.downcycleEnableForHTML4 == true))
       )
    {
      //try
      {
        console.log('processing request as downcycled page', pl.url);

        const html = await downcycling.getStrippedPage(pl.url, pl.html);
        new StrippedV().draw(res, pl, html);

        return true;
      }
      //catch {}
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
      new EmptyV().draw(res);

      return true;
    }
    catch {}

    return false;
  }
}
