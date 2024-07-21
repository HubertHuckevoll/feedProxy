import * as tools             from '../lb/Tools.js';
import { JSDOM as dom }       from 'jsdom';

export class MetadataScraper
{

  constructor(url, html, prefs)
  {
    this.url = url;
    this.prefs = prefs;
    this.html = html;
  }

  async get()
  {
    const doc = new dom(this.html, {url: this.url}).window.document;
    const ret =
    {
      title: this.extractTitle(doc),
      description: this.extractDescription(doc),
      image: this.extractImage(doc, this.url),
      isHTML5: this.isHTML5(doc)
    };

    return ret;
  }

  /******************************************************************
   * we are a retro proxy, so in case of no doctype we assume HTML4
   * as this is probably what the user will visit... or is it?
   *****************************************************************/
  isHTML5(doc)
  {
    let isHtml5 = false;
    const doctype = doc.doctype;

    isHtml5 = doctype && doctype.name === "html" && doctype.publicId === "" && doctype.systemId === "";

    return isHtml5;
  }

  extractTitle(doc)
  {
    let node = '';
    let result = '';

    node = doc.querySelector('meta[property="og:title"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';

    if (result === '')
    {
      node = doc.querySelector('meta[property="twitter:title"]');
      result = (node !== null) ? node.getAttribute('content').trim() : '';
    }

    if (result === '')
    {
      node = doc.querySelector('head title');
      result = (node !== null) ? node.textContent.trim() : '';
    }

    return result;
  }

  extractDescription(doc)
  {
    let node = '';
    let result = '';

    node = doc.querySelector('meta[property="og:description"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';

    if (result === '')
    {
      node = doc.querySelector('meta[property="twitter:description"]');
      result = (node !== null) ? node.getAttribute('content').trim() : '';
    }

    if (result === '')
    {
      node = doc.querySelector('meta[name="description"]');
      result = (node !== null) ? node.getAttribute('content').trim() : '';
    }

    return result;
  }

  extractImage(doc, url)
  {
    let node = '';
    let result = '';
    const tld = tools.tldFromUrl(url);

    node = doc.querySelector('meta[property="og:image"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';

    if (result === '')
    {
      node = doc.querySelector('meta[property="twitter:image"]');
      result = (node !== null) ? node.getAttribute('content').trim() : '';
    }

    if (result === '')
    {
      node = doc.querySelector('link[rel="apple-touch-icon"');
      result = (node !== null) ? node.getAttribute('href').trim() : '';
    }

    if (result.startsWith('//'))
    {
      result = 'http:' + result;
    }
    else
    {
      if (result.startsWith('/'))
      {
        result = tld + result;
      }
    }

    return result;
  }
}
