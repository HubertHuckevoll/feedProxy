import * as tools             from './tools.js';
import * as metadataScraper   from './metadataScraper.js';

export async function get(request, response)
{
  const result = {
    url: undefined,
    tld: undefined,
    feedProxy: undefined,
    mimeType: undefined,
    html: undefined,
    size: undefined,
    meta: undefined
  };

  result.url = tools.reworkURL(request.url);
  result.tld = tools.tldFromUrl(result.url);
  result.feedProxy = new URL(result.url).searchParams.get('feedProxy');

  result.mimeType = await tools.getMimeType(result.url);

  if (result.mimeType.includes('text/html'))
  {
    result.html = await tools.rFetchUrlText(result.url, request);
    result.size = parseInt(result.html.length / 1024);
    result.meta = await metadataScraper.get(result.url, result.html);
  }

  return result;
}