//import fetch                from 'node-fetch';
import { extract }        from '@extractus/feed-extractor'

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
      const res = await this.tools.rFetch(url);
      const xml = await res.text()

      const feed = extract(xml);
      return feed;
    }
    catch (err)
    {
      console.log(err);
    }
  }


}

