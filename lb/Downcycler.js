import { JSDOM as dom }                         from 'jsdom';
import { isProbablyReaderable as isReaderable } from '@mozilla/readability';
import { Readability as articleExtractor }      from '@mozilla/readability';
import normalizeWhitespace                      from 'normalize-html-whitespace';

export class Downcycler
{
  constructor(url, prefs)
  {
    this.url = url;
    this.prefs = prefs;
  }

  isArticle(html)
  {
    const doc = new dom(html, {url: this.url});
    return isReaderable(doc.window.document);
  }

  getArticle(html)
  {
    const doc = new dom(html, {url: this.url});
    const reader = new articleExtractor(doc.window.document);

    const pageObj = reader.parse();
    pageObj.content = this.removeTags(pageObj.content, true);
    pageObj.content = this.removeAttrs(pageObj.content, true);
    pageObj.content = this.boxImages(pageObj.content, true);
    pageObj.content = normalizeWhitespace(pageObj.content);

    return pageObj;
  }

  getStrippedPage(html)
  {
    html = this.removeTags(html, false);
    html = this.removeAttrs(html, false);
    html = this.boxImages(html, true);
    html = normalizeWhitespace(html);
    return html;
  }

  removeTags(html, htmlIsFragment)
  {
    let doc = new dom(html, {url: this.url}).window.document;
    const tags = (this.prefs.downcycleTags) ? this.prefs.downcycleTags : [];

    tags.forEach((tag) =>
    {
      const tagsFound = doc.querySelectorAll(tag);
      tagsFound.forEach((tagFound) =>
      {
        tagFound.parentNode.removeChild(tagFound);
      });
    });

    if (htmlIsFragment) {
      html = doc.documentElement.querySelector('body').innerHTML;
    } else {
      html = doc.documentElement.outerHTML;
    }

    return html;
  }

  removeAttrs(html, htmlIsFragment)
  {
    let doc = new dom(html, {url: this.url}).window.document;
    const attrs = (this.prefs.downcycleAttrs) ? this.prefs.downcycleAttrs : [];
    const dynAttrs = (this.prefs.downcycleDynAttrs) ? this.prefs.downcycleDynAttrs : [];

    const els = doc.querySelectorAll('*');
    els.forEach((el) =>
    {
      attrs.forEach((attr) =>
      {
        if (el.hasAttribute(attr))
        {
          el.removeAttribute(attr);
        }
      });

      dynAttrs.forEach((dynAttr) =>
      {
        Object.values(el.attributes).forEach(({name}) =>
        {
          if (name.includes(dynAttr))
          {
            el.removeAttribute(name);
          }
        });
      });
    });

    if (htmlIsFragment) {
      html = doc.documentElement.querySelector('body').innerHTML;
    } else {
      html = doc.documentElement.outerHTML;
    }

    return html;
  }

  boxImages(html, htmlIsFragment)
  {
    let doc = new dom(html, {url: this.url}).window.document;
    const tags = ['img'];

    tags.forEach((tag) =>
    {
      const tagsFound = doc.querySelectorAll(tag);
      tagsFound.forEach((tagFound) =>
      {
        let w = tagFound.getAttribute('width');
        if (w)
        {
          w = (w < 512) ? w : 512;
          tagFound.setAttribute('width', w);
          tagFound.removeAttribute('height');
        }
      });
    });

    if (htmlIsFragment) {
      html = doc.documentElement.querySelector('body').innerHTML;
    } else {
      html = doc.documentElement.outerHTML;
    }

    return html;
  }

}
