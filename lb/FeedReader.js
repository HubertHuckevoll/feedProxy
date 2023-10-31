import * as tools             from '../lb/Tools.js';
import * as feedExtractor     from '@extractus/feed-extractor';
export class FeedReader
{
  async get(url)
  {
    try
    {
      const res = await tools.rFetch(url);
      const xml = await res.text()

      const feed = feedExtractor.extractFromXml(xml);
      return feed;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}

