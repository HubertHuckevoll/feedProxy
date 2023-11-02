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

  get(html)
  {
    try
    {
      let pageObj = {};
      const doc = new dom(html, {url: this.url});
      if (isReaderable(doc.window.document))
      {
        let reader = new articleExtractor(doc.window.document);
        pageObj = reader.parse();
        pageObj.type = 'article';
      }
      else
      {
        html = this.removeTags(html);
        html = this.removeAttrs(html);
        html = normalizeWhitespace(html);
        pageObj.content = html;
        pageObj.type = 'stripped';
      }

      return pageObj;
    }
    catch(err)
    {
      throw(err);
    }
  }

  removeTags(html)
  {
    let doc = new dom(html, {url: this.url}).window.document;

    const tags = ['script', 'style', 'link', 'svg', 'video', 'audio', 'object', 'embed'];

    tags.forEach((tag) =>
    {
      const tagsFound = doc.querySelectorAll(tag);
      tagsFound.forEach((tagFound) =>
      {
        tagFound.parentNode.removeChild(tagFound);
      });
    });

    html = doc.documentElement.outerHTML;
    return html;
  }

  removeAttrs(html)
  {
    let doc = new dom(html, {url: this.url}).window.document;
    const attrs = ['class', 'style'];
    const dynAttrs = ['data-', 'aria-'];

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
            el.removeAttribute(name)
          }
        });
      });
    });

    html = doc.documentElement.outerHTML;
    return html;
  }

}
