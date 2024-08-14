import * as tools             from './tools.js';
import * as metadataScraper   from './metadataScraper.js';

export async function getPayload(request, response)
{
  const result = {
    url: null,
    tld: null,
    feedProxy: null,
    mimeType: null,
    isTextual: null,
    html: null,
    size: null,
    meta: null
  };

  result.url = tools.reworkURL(request.url);
  result.tld = tools.tldFromURL(result.url);
  result.feedProxy = new URL(result.url).searchParams.get('feedProxy');

  result.isTextual = false;
  result.mimeType = await tools.getMimeType(result.url);

  if (
        result.mimeType.includes('text/html') ||
        result.mimeType.includes('application/xml')
     )
  {
    result.html = await tools.rFetchUrlText(result.url, request);
    result.size = parseInt(result.html.length / 1024);
    result.meta = await metadataScraper.getMetadata(result.url, result.html);
    if (result.meta.isHTML5 !== null) result.isTextual = true;
  }

  return result;
}
