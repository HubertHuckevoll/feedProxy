import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

export class feedRat
{
  constructor()
  {
    try
    {
      // candidates & more
      this.types = ['application/rss+xml', 'application/atom+xml'];
      this.usualSuspects = ['/feed.xml', '/rss.xml', '/feed', '/rss', '/atom.xml', '.rss'];

      // the return value
      this.feeds = [];
    }
    catch (err)
    {
      throw(err);
    }
  }

  async run(url)
  {
    const tld = this.tldFromUrl(url);
    const baseURL = url.replace(/\/$/, '');

    try
    {
      if (await this.isRss(baseURL))
      {
        this.feeds.push(baseURL);
        return this.feeds;
      }

      await this.checkTheDom(baseURL);
      await this.checkSuspects(baseURL);
      await this.checkTheDom(tld);
      await this.checkSuspects(tld);

      return this.feeds;
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
    const tld = this.tldFromUrl(url);

    try
    {
      const response = await fetch(url);
      const text = await response.text();

      const doc = new DOMParser().parseFromString(text, "text/html");
      const nodes = doc.querySelectorAll('head link');
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

  tldFromUrl(url)
  {
    const p = new URL(url);
    const protocol = (p.protocol != null) ? p.protocol : 'https:';
    const tld = protocol + '//' + p.host;

    return tld;
  }

}

