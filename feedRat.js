import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Tools } from "./Tools.js";

export class feedRat
{
  constructor(rssHintTable)
  {
    // our RSS hints
    this.rssHintTable = rssHintTable;

    // candidates & more
    this.types = ['application/rss+xml', 'application/atom+xml'];
    this.usualSuspects = ['/feed.xml', '/rss.xml', '/feed', '/rss', '/atom.xml', '.rss'];

    // the return value
    this.feeds = [];
  }

  async run(url)
  {
    //const tools = new Tools();
    //const tld = tools.tldFromUrl(url);
    const origURL = url.replace(/\/$/, '');

    try
    {
      await this.checkTheDom(origURL);

      if (this.feeds.length == 0)
      {
        await this.checkSuspects(origURL);

        if (this.feeds.length == 0)
        {
          this.checkHintTable(origURL);
        }
      }

      // remove duplicates
      const feeds = [...new Set(this.feeds)];

      return feeds;
    }
    catch (err)
    {
      throw(err);
    }
  }

  async isRss(url)
  {
    console.log('Checking if URL is RSS:', url);
    try
    {
      const response = await fetch(url);
      if (response.ok && response.headers.get('content-type').includes('xml'))
      {
        console.log('...it is:', true);
        return true;
      }
      console.log('...it is not:', false);
      return false;
    }
    catch (err)
    {
      throw(err);
    }
  }

  async checkTheDom(url)
  {
    console.log('Checking the DOM of:', url);
    const tools = new Tools();
    const tld = tools.tldFromUrl(url);

    try
    {
      const response = await fetch(url);
      const text = await response.text();

      const doc = new DOMParser().parseFromString(text, "text/html");
      const nodes = doc.querySelectorAll('link'); //link[rel="alternate"]  // FIXME on zeit.de/index
      let feedURL = '';

      nodes.forEach((node) =>
      {
        if (this.types.includes(node.getAttribute('type')))
        {
          const href = node.getAttribute('href');
          if (!href.startsWith('http'))
          {
            feedURL = (href.startsWith('/')) ? tld + href : tld + '//' + href;
          }
          else
          {
            feedURL = href;
          }
          console.log('...adding URL:', feedURL);
          this.feeds.push(feedURL);
        }
      });
    }
    catch(err)
    {
      throw(err);
    }
  }

  async checkSuspects(url)
  {
    console.log('Checking the usual suspects:');
    for (const suspect of this.usualSuspects)
    {
      try
      {
        if (await this.isRss(url + suspect))
        {
          this.feeds.push(url + suspect);
          console.log(`... adding URL ${url + suspect}.`);
        }
      }
      catch(_err)
      {
        console.log(`... URL ${url + suspect} does not exist.`);
      }
    }
  }

  checkHintTable(url)
  {
    console.log('Checking the hint table:');
    for (const elem of this.rssHintTable)
    {
      const origURL = url.replace(/:[\d]{2,4}$/, '');
      const elemURL = elem.url.replace(/\/$/, '');

      console.log(origURL, elemURL);
      if (origURL == elemURL)
      {
        this.feeds.push(elem.feedUrl);
        console.log('...adding: ', elem.feedUrl);
        break;
      }
    }
  }

}

