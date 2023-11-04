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
        pageObj.content = this.removeTags(pageObj.content, true);
        pageObj.content = this.removeAttrs(pageObj.content, true);
        pageObj.content = this.boxImages(pageObj.content, true);
        pageObj.content = normalizeWhitespace(pageObj.content);
        pageObj.type = 'article';
      }
      else
      {
        html = this.removeTags(html, false);
        html = this.removeAttrs(html, false);
        html = this.boxImages(html, true);
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

  removeTags(html, htmlIsFragment)
  {
    let doc = new dom(html, {url: this.url}).window.document;

    const tags = ['script', 'style', 'link', 'svg', 'picture', 'video', 'audio', 'object', 'embed'];

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
