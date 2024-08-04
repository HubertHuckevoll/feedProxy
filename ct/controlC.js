import * as tools             from '../lb/tools.js';
import * as feedSniffer       from '../lb/feedSniffer.js';

import * as feedReader        from '../lb/feedReader.js';
import * as imageProcessor    from '../lb/imageProcessor.js';
import * as downcycling       from '../lb/downcycling.js';

import { ImageV }             from '../vw/ImageV.js';
import { OverloadWarningV }   from '../vw/OverloadWarningV.js';
import { StrippedV }          from '../vw/StrippedV.js';
import { EmptyV }             from '../vw/EmptyV.js';
import { FeedV }              from '../vw/FeedV.js';
import { ArticleV }           from '../vw/ArticleV.js';


export async function run(request, response, payload)
{
  let wasProcessed = false;

  // image - proxy image, convert to GIF if not GIF yet
  if (wasProcessed === false) wasProcessed = await imageProxyC(request, response, payload);

  // Process top level domain as feed (if one exists)?
  if (wasProcessed === false) wasProcessed = await indexAsFeedC(request, response, payload);

  // process as overload warning?
  if (wasProcessed === false) wasProcessed = await overloadC(request, response, payload);

  // process as article?
  if (wasProcessed === false) wasProcessed = await readerableC(request, response, payload);

  // process as downcycle?
  if (wasProcessed === false) wasProcessed = await strippedC(request, response, payload);

  // if not processed, passthru - hopefully just big text files or binary downloads...
  if (wasProcessed === false) wasProcessed = await passthroughC(request, response, payload);

  // if still not processed (error...?): return empty, works best.
  if (wasProcessed === false) wasProcessed = emptyC(request, response);

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
      console.log('PROCESSING image', pl.url, pl.mimeType);

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
        console.log('PROCESSING top level domain as feed', pl.url);
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
        console.log('PROCESSING request as article', pl.url);

        const pageObj = await downcycling.getArticle(pl.url, pl.html);
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

async function overloadC(req, res, pl)
{
  if (
        (pl.mimeType && pl.mimeType.includes('text/html')) &&
        (pl.feedProxy != 'lP')
      )
  {
    try
    {
      const html = await downcycling.getStrippedPage(pl.url, pl.html);

      if ((html.length / 1024) > globalThis.prefs.overloadTreshold)
      {
        console.log('PROCESSING request as overload warning', pl.url);
        new OverloadWarningV().draw(res, pl);

        return true;
      }
    }
    catch (e)
    {
      console.log('ERROR processing as overload warning', pl.url, e);
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
      console.log('PROCESSING request as downcycled page', pl.url);

      const html = await downcycling.getStrippedPage(pl.url, pl.html);
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
  console.log('PROCESSING request as passthrough', pl.url, pl.mimeType);

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
export function emptyC(req, res)
{
  console.log('PROCESSING as empty');

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
