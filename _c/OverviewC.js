import { TsvImp }   from '../_l/TsvImp.js';
import { FeedSniffer }  from '../_l/FeedSniffer.js';
import { MetadataScraper } from '../_l/MetadataScraper.js';

export class OverviewC
{
  constructor(view)
  {
    this.view = view;
  }

  async get(url)
  {
    const rssHintTableAddress = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTToY09sxeo57zbb-5hXF7ElwI6NaDACTWx_itnF4yVV9j1V_s-H3FTCKP8a17K22tzLFazhCcO82uL/pub?output=tsv';
    const res = await fetch(rssHintTableAddress);
    let rssHintTable = await res.text();
    rssHintTable = new TsvImp().fromTSV(rssHintTable);

    const fr = new FeedSniffer(rssHintTable);
    const feeds = await fr.get(url);
    console.log('Feeds found: ', feeds);

    const meta = await new MetadataScraper().get(url);
    console.log('Page metadata read: ', meta);

    const response = this.view.drawOverview(url, meta, feeds);

    return response;
  }
}