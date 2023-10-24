export class FeedReader
{
  constructor(feedExtractor, tools)
  {
    this.feedExtractor = feedExtractor;
    this.tools = tools;
  }

  async get(url)
  {
    try
    {
      const res = await this.tools.rFetch(url);
      const xml = await res.text()

      const feed = this.feedExtractor.extractFromXml(xml);
      return feed;
    }
    catch (err)
    {
      console.log(err);
    }
  }


}

