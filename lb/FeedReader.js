//import fetch                from 'node-fetch';
import { extractFromXml }     from '@extractus/feed-extractor'

export class FeedReader
{
  constructor(tools)
  {
    this.tools = tools;
  }

  async get(url)
  {
    try
    {
      console.log('DAAA XML', url);
      const res = await this.tools.rFetch(url);
      const xml = await res.text()

      const feed = extractFromXml(xml);
      return feed;
    }
    catch (err)
    {
      console.log(err);
    }
  }


}

