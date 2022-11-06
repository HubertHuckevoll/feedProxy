import { FeedSniffer }  from '../_l/FeedSniffer.js';
import { MetadataScraper } from '../_l/MetadataScraper.js';

export class OverviewC
{
  constructor(view, rssHintTable)
  {
    this.rssHintTable = rssHintTable;
    this.view = view;
  }

  async get(res, url)
  {
    try
    {
      const fr = new FeedSniffer(this.rssHintTable);
      const feeds = await fr.get(url);
      console.log('Feeds found: ', feeds);

      const meta = await new MetadataScraper().get(url);
      console.log('Page metadata read: ', meta);

      const html = this.view.drawOverview(url, meta, feeds);

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