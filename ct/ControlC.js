import fetch                from 'node-fetch';
//import { Readability }      from '@mozilla/readability';
export class ControlC
{

  constructor(tools)
  {
    this.tools = tools;
  }

  emptyC(res)
  {
    try
    {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('');

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  async feedContentC(view, rssReader, res, url)
  {
    try
    {
      const feed = await rssReader.read(url);
      console.log('Feed read successfully.');

      const html = view.drawArticlesForFeed(feed);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch(err)
    {
      console.log(err);
      return false;
    }
  }

  async imageProxyC(Jimp, res, url)
  {
    try
    {
      let image = await Jimp.read(url);
      image.resize(256, Jimp.AUTO);
      image.dither565();
      const bin = await image.getBufferAsync(Jimp.MIME_GIF); // Returns Promise

      res.writeHead(200, {'Content-Type': 'image/gif'});
      res.end(bin, 'binary');

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  async overviewC(view, feedSniffer, metadataScraper, res, url)
  {
    try
    {
      const feeds = await feedSniffer.get(url);
      console.log('Feeds found: ', feeds);

      const meta = await metadataScraper.get(url);
      console.log('Page metadata read: ', meta);

      const html = view.drawOverview(url, meta, feeds);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch(err)
    {
      console.log(err);
      return false;
    }
  }

  async passthroughC(req, res, url)
  {
    try
    {
      let bin = null;
      const response = await this.tools.rFetch(url);
      const conType = response.headers.get("content-type");

      bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));

      res.writeHead(200, {'Content-Type': conType});
      res.end(bin);

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

/*
  async upcycleC(req, res, view, JSDOM, parser, url)
  {
    try
    {
      let bin = null;
      const resp = await this.tools.rFetch(url);
      let html = await resp.text();
      let doc = new JSDOM(html, {url: url});
      doc = doc.window.document;
      let article = new Readability(doc).parse().content;

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(article);

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }
*/

  async previewC(view, articleParser, res, url)
  {
    try
    {
      const extractHTMLOptions =
      {
        allowedTags: [ 'p', 'span', 'em', 'ul', 'ol', 'li', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7' ]
      }
      articleParser.setSanitizeHtmlOptions(extractHTMLOptions);

      const resp = await fetch(url);
      const text = await resp.text();
      const pageObj = await articleParser.extract(text);
      const html = view.drawPreview(pageObj);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }
}
