import * as tools             from './tools.js';
import * as feedExtractor     from '@extractus/feed-extractor';

export async function getFeed(url)
{
  const res = await tools.rFetchUrl(url);
  const xml = await res.text();

  const feed = feedExtractor.extractFromXml(xml);
  return feed;
}


