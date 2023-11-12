import * as tools             from '../lb/Tools.js';
import { MetadataScraper }    from '../lb/MetadataScraper.js';

export class Payload
{
  constructor(url, prefs)
  {
    this.url = url;
    this.prefs = prefs;
  }

  async get()
  {
    const result = {};
    result.url = this.url;
    result.tld = tools.tldFromUrl(this.url);
    result.mimeType = await tools.getMimeType(this.url);

    if ((result.mimeType) && result.mimeType.includes('text/html'))
    {
      result.html = await tools.rFetchText(this.url);
      result.size = parseInt(result.html.length / 1024);
      result.meta = await new MetadataScraper(this.url, result.html, this.prefs).get();
    }

    return result;
  }
}

