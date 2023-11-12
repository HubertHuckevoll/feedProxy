import * as tools             from '../lb/Tools.js';
import { JSDOM as dom }       from 'jsdom';

export class FeedSniffer
{
  constructor(rssHintTable)
  {
    // our RSS hints
    this.rssHintTable = rssHintTable;

    // candidates & more
    this.types = ['application/rss+xml', 'application/atom+xml', 'application/xml'];
    this.usualSuspects = ['/feed.xml', '/rss.xml', '/feed', '/rss', '/atom.xml', '/.rss', '/rssfeed.rdf'];

    // the return value
    this.feeds = [];
  }

  async get(url, html)
  {
    try
    {
      this.checkHintTable(url);

      if (this.feeds.length == 0)
      {
        await this.checkTheDom(url, html);

        if (this.feeds.length == 0)
        {
          await this.checkSuspects(url);
        }
      }

      // remove duplicates
      const feeds = [...new Set(this.feeds)];

      return feeds;
    }
    catch (err)
    {
      console.log(err);
    }
  }

  async checkTheDom(url, html)
  {
    tools.cLog('checking the DOM of', url);

    const tld = tools.tldFromUrl(url);

    try
    {
      const doc = new dom(html, {url: url});
      const nodes = doc.window.document.querySelectorAll('link'); //link[rel="alternate"]  // FIXME on zeit.de/index
      let feedURL = '';

      nodes.forEach((node) =>
      {
        if (this.types.includes(node.getAttribute('type')))
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
          this.feeds.push(feedURL);
        }
      });
    }
    catch(err)
    {
      console.log(err);
    }
  }

  async checkSuspects(url)
  {
    tools.cLog('checking the usual suspects for', url);

    for (const suspect of this.usualSuspects)
    {
      try
      {
        if (await tools.isRss(url + suspect))
        {
          this.feeds.push(url + suspect);
        }
      }
      catch(err)
      {
        console.log(err);
      }
    }
  }

  checkHintTable(url)
  {
    tools.cLog('checking the hint table for', url);

    for (const elem of this.rssHintTable)
    {
      const elemURL = elem.url.replace(/\/$/, '');
      if (url.includes(elemURL))
      {
        this.feeds.push(elem.feedUrl);
        break;
      }
    }
  }

}

