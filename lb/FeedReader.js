export class FeedReader
{
  constructor(extractor, tools)
  {
    this.extractor = extractor;
    this.tools = tools;
  }

  async get(url)
  {
    try
    {
      const res = await this.tools.rFetch(url);
      const xml = await res.text()

      const feed = this.extractor(xml);
      return feed;
    }
    catch (err)
    {
      console.log(err);
    }
  }


}

