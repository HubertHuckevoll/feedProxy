import { read } from 'feed-reader'

export class FeedContentC
{
  constructor(view)
  {
    this.view = view;
  }

  async get(res, url)
  {
    try
    {
      const feed = await read(url);
      console.log('Feed read successfully.');

      const html = this.view.drawArticlesForFeed(feed);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);

      return true;
    }
    catch(err)
    {
      console.log(err);
    }
  }
}