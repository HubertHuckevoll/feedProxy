import { FeedSniffer }  from '../_l/FeedSniffer.js';
import { MetadataScraper } from '../_l/MetadataScraper.js';

export class OverviewC
{
  constructor(view, rssHintTable)
  {
    this.rssHintTable = rssHintTable;
    this.view = view;
  }

  async get(url)
  {
    const fr = new FeedSniffer(this.rssHintTable);
    const feeds = await fr.get(url);
    console.log('Feeds found: ', feeds);

    const meta = await new MetadataScraper().get(url);
    console.log('Page metadata read: ', meta);

    const response = this.view.drawOverview(url, meta, feeds);

    return response;
  }
}