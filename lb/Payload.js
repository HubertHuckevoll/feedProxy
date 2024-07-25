import * as tools             from '../lb/Tools.js';
import { MetadataScraper }    from '../lb/MetadataScraper.js';

export class Payload
{

  async get(request, response)
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
      result.meta = await new MetadataScraper(result.url, result.html, globalThis.prefs).get();
    }

    return result;
  }
}

