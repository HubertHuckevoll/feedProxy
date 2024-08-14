import * as tools             from './tools.js';

// candidates & more
const types = ['application/rss+xml', 'application/atom+xml', 'application/xml'];
const usualSuspects = ['/feed.xml', '/rss.xml', '/feed', '/rss', '/atom.xml', '/.rss', '/rssfeed.rdf'];

export async function getFeeds(url, html)
{
  let feeds = [];

  feeds = checkHintTable(feeds, url);

  if (feeds.length == 0)
  {
    feeds = await checkTheDom(feeds, url, html);

    if (feeds.length == 0)
    {
      feeds = await checkSuspects(feeds, url);
    }
  }

  // remove duplicates
  feeds = [...new Set(feeds)];

  tools.cLog('Feeds found:', feeds);

  return feeds;
}

async function checkTheDom(feeds, url, html)
{
  tools.cLog('checking the DOM of', url);

  const tld = tools.tldFromURL(url);
  const doc = tools.createDom(url, html);
  const nodes = doc.querySelectorAll('link'); //link[rel="alternate"]  // FIXME on zeit.de/index
  let feedURL = '';

  nodes.forEach((node) =>
  {
    if (types.includes(node.getAttribute('type')))
    {
      const href = node.getAttribute('href');
      if (!href.startsWith('http'))
      {
        feedURL = (href.startsWith('/')) ? tld + href : tld + '/' + href;
      }
      else
      {
        feedURL = href;
      }
      feeds.push(feedURL);
    }
  });

  return feeds;
}

async function checkSuspects(feeds, url)
{
  tools.cLog('checking the usual suspects for', url);

  for (const suspect of usualSuspects)
  {
    try
    {
      if (await tools.isRss(url + suspect))
      {
        feeds.push(url + suspect);
      }
    }
    catch(err)
    {
      console.log(err);
    }
  }

  return feeds;
}

function checkHintTable(feeds, url)
{
  tools.cLog('checking the hint table for', url);

  for (const elem of globalThis.prefs.rssHintTable)
  {
    const elemURL = elem.url.replace(/\/$/, '');
    if (url === elemURL)
    {
      feeds.push(elem.feedUrl);
      break;
    }
  }

  return feeds;
}
