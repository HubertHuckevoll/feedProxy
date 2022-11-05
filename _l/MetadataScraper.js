import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import * as tools from "./Tools.js";

export class MetadataScraper
{
  async get(url)
  {
    try
    {
      const response = await fetch(url);
      const text = await response.text();

      const doc = new DOMParser().parseFromString(text, "text/html");

      const ret =
      {
        title: this.extractTitle(doc),
        description: this.extractDescription(doc),
        image: this.extractImage(doc, url)
      };

      return ret;
    }
    catch(err)
    {
      throw(err);
    }
  }

  extractTitle(doc)
  {
    let node = '';
    let result = '';

    node = doc.querySelector('meta[property="og:title"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';

    if (result == '')
    {
      node = doc.querySelector('meta[property="twitter:title"]');
      result = (node !== null) ? node.getAttribute('content').trim() : '';

      if (result == '')
      {
        node = doc.querySelector('head title');
        result = (node !== null) ? node.textContent.trim() : '';
      }
    }

    return result;
  }

  extractDescription(doc)
  {
    let node = '';
    let result = '';

    node = doc.querySelector('meta[property="og:description"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';

    if (result == '')
    {
      node = doc.querySelector('meta[property="twitter:description"]');
      result = (node !== null) ? node.getAttribute('content').trim() : '';

      if (result == '')
      {
        node = doc.querySelector('meta[name="description"]');
        result = (node !== null) ? node.getAttribute('content').trim() : '';
      }
    }

    return result;
  }

  extractImage(doc, url)
  {
    let node = '';
    let result = '';

    node = doc.querySelector('meta[property="og:image"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';

    if (result == '')
    {
      node = doc.querySelector('meta[property="twitter:image"]');
      result = (node !== null) ? node.getAttribute('content').trim() : '';

      if (result == '')
      {
        node = doc.querySelector('link[rel="apple-touch-icon"');
        result = (node !== null) ? node.getAttribute('href').trim() : '';
      }
    }
    const tld = tools.tldFromUrl(url);
    if (result.startsWith('//')) result = 'http:' +  result;
    if (result.startsWith('/'))  result =  tld + '/' + result;

    return result;
  }
}
