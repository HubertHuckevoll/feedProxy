import * as tools             from '../lb/tools.js';
import * as feedSniffer       from '../lb/feedSniffer.js';

import * as feedReader        from '../lb/feedReader.js';
import * as imageProcessor    from '../lb/imageProcessor.js';
import * as downcycling       from '../lb/downcycling.js';

import { ImageV }             from '../vw/ImageV.js';
import { OverloadWarningV }   from '../vw/OverloadWarningV.js';
import { StrippedV }          from '../vw/StrippedV.js';
import { EmptyV }             from '../vw/EmptyV.js';
import { ErrorV }             from '../vw/ErrorV.js';
import { FeedV }              from '../vw/FeedV.js';
import { ArticleV }           from '../vw/ArticleV.js';


export async function run(request, response, payload)
{
  let wasProcessed = false;

  // image - proxy image, convert to GIF if not GIF yet
  wasProcessed = (wasProcessed === false) ? await imageProxyC(request, response, payload) : wasProcessed;

  // Process top level domain as feed (if one exists)?
  wasProcessed = (wasProcessed === false) ? await indexAsFeedC(request, response, payload) : wasProcessed;

  // process as overload warning?
  wasProcessed = (wasProcessed === false) ? await overloadC(request, response, payload) : wasProcessed;

  // process as article?
  wasProcessed = (wasProcessed === false) ? await readerableC(request, response, payload) : wasProcessed;

  // process as downcycle?
  wasProcessed = (wasProcessed === false) ? await strippedC(request, response, payload) : wasProcessed;

  // if not processed, passthru - hopefully just big text files or binary downloads...
  wasProcessed = (wasProcessed === false) ? await passthroughC(request, response, payload) : wasProcessed;

  // if still not processed (error...?): return empty, works best.
  wasProcessed = (wasProcessed === false) ? await emptyC(request, response) : wasProcessed;

  return wasProcessed;
}

async function imageProxyC(req, res, pl)
{
  if (
        (pl.mimeType) &&
        (pl.mimeType.includes('image')) &&
        ((pl.mimeType != 'image/gif') || ((pl.mimeType == 'image/gif') && (globalThis.prefs.imagesTreatGIFs == true)))
      )
  {
    try
    {
      console.log('processing image', pl.url, pl.mimeType);

      const bin = await imageProcessor.get(pl.url);
      new ImageV().draw(res, bin);

      return true;
    }
    catch (e)
    {
      console.log('ERROR processing as image', pl.url, e);
    }
  }

  return false;
}

async function indexAsFeedC(req, res, pl)
{
  if (
        (globalThis.prefs.feedDetectionEnabled) &&
        (pl.url == pl.tld) &&
        (pl.meta.isHTML5) || (globalThis.prefs.downcycleEnableForHTML4 == true)
      )
  {
    try
    {
      const feeds = await feedSniffer.get(pl.url, pl.html);

      if (feeds.length > 0)
      {
        console.log('processing top level domain as feed', pl.url);
        console.log('feeds found', pl.url, feeds);

        const feed = await feedReader.get(feeds[0]);

        console.log('feed read successfully');
        tools.cLog(feed);

        new FeedV().draw(res, pl.url, feed);

        return true;
      }
    }
    catch (e)
    {
      console.log('ERROR processing as feed', pl.url, e);
    }
  }

  return false;
}

async function overloadC(req, res, pl)
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
    catch (e)
    {
      console.log('ERROR processing as overload warning', pl.url, e);
    }
  }

  return false;
}

async function readerableC(req, res, pl)
{
  if (
      (pl.mimeType && pl.mimeType.includes('text/html')) &&
      (pl.feedProxy != 'lP') &&
      ((pl.feedProxy == 'lA') || (globalThis.prefs.downcycleDetectReaderable == true)) &&
      (pl.meta.isHTML5) || (globalThis.prefs.downcycleEnableForHTML4 == true)
      )
  {
    try
    {
      if (downcycling.isArticle(pl.url, pl.html))
      {
        console.log('processing request as article', pl.url);

        const pageObj = downcycling.getArticle(pl.url, pl.html);
        new ArticleV().draw(res, pl, pageObj);

        return true;
      }
    }
    catch (e)
    {
      console.log('ERROR processing as article', pl.url, e);
    }
  }

  return false;
}

async function strippedC(req, res, pl)
{
  if (
        (pl.mimeType && pl.mimeType.includes('text/html')) &&
        (pl.meta.isHTML5 || (globalThis.prefs.downcycleEnableForHTML4 == true))
      )
  {
    try
    {
      console.log('processing request as downcycled page', pl.url);

      const html = downcycling.getStrippedPage(pl.url, pl.html);
      new StrippedV().draw(res, pl, html);

      return true;
    }
    catch (e)
    {
      console.log('ERROR processing as downcycled page', pl.url, e);
    }
  }

  return false;
}

async function passthroughC(req, res, pl)
{
  console.log('processing request as passthrough', pl.url, pl.mimeType);

  try
  {
    const fetchResponse = await tools.rFetchUrl(pl.url);
    fetchResponse.body.pipe(res);

    return true;
  }
  catch (e)
  {
    console.log('ERROR processing as passthrough', pl.url, e);
  }

  return false;
}

/********************************************************************
// emptyC must be exported!
********************************************************************/
export async function emptyC(req, res)
{
  console.log('processing as empty');

  try
  {
    new EmptyV().draw(res);

    return true;
  }
  catch (e)
  {
    console.log('ERROR processing as empty', e);
  }

  return false;
}
