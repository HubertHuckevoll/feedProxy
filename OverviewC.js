import { TsvImp }   from './TsvImp.js';
import { feedRat }  from './feedRat.js';
import { pageMeta } from './pageMeta.js';

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

    const fr = new feedRat(rssHintTable);
    const feeds = await fr.run(url);
    console.log('Feeds found: ', feeds);

    const meta = await new pageMeta(url).get();
    console.log('Page metadata read: ', meta);

    const response = this.view.drawOverview(meta, feeds);

    return response;
  }
}