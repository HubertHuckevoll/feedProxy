import * as tools             from './tools.js';

// candidates & more
const types = ['application/rss+xml', 'application/atom+xml', 'application/xml'];
const usualSuspects = ['/feed.xml', '/rss.xml', '/feed', '/rss', '/atom.xml', '/.rss', '/rssfeed.rdf'];
let feeds = [];

export async function get(url, html)
{
  feeds = [];

  checkHintTable(url);

  if (feeds.length == 0)
  {
    await checkTheDom(url, html);

    if (feeds.length == 0)
    {
      await checkSuspects(url);
    }
  }

  // remove duplicates
  feeds = [...new Set(feeds)];

  tools.cLog('Feeds found:', feeds);

  return feeds;
}

async function checkTheDom(url, html)
{
  tools.cLog('checking the DOM of', url);

  const tld = tools.tldFromUrl(url);
  const doc = tools.createDom(url, html);
  const nodes = doc.window.document.querySelectorAll('link'); //link[rel="alternate"]  // FIXME on zeit.de/index
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
}

async function checkSuspects(url)
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
}

function checkHintTable(url)
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
}
