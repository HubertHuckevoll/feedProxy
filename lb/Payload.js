import * as tools             from '../lb/Tools.js';
import { MetadataScraper }    from '../lb/MetadataScraper.js';

export class Payload
{
  constructor(prefs)
  {
    this.prefs = prefs;
  }

  async get(request, response)
  {
    const result = {};

    result.url = tools.reworkURL(request.url);
    result.tld = tools.tldFromUrl(result.url);
    result.feedProxy = new URL(result.url).searchParams.get('feedProxy');

    try
    {
      result.mimeType = await tools.getMimeType(result.url);

      if ((result.mimeType) && result.mimeType.includes('text/html'))
      {
        result.html = await tools.rFetchUrlText(result.url, request);
        result.size = parseInt(result.html.length / 1024);
        result.meta = await new MetadataScraper(result.url, result.html, this.prefs).get();
      }
    }
    catch (e)
    {
      console.log(e);
    }

    return result;
  }
}

