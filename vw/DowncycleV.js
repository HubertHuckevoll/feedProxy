import { JSDOM as dom }    from 'jsdom';
import normalizeWhitespace from 'normalize-html-whitespace';
import { BaseV }           from '../vw/BaseV.js';

export class DowncycleV extends BaseV
{
  constructor(url, prefs)
  {
    super();
    this.url = url;
    this.prefs = prefs;
  }

  async draw(html)
  {
    try
    {
      html = this.removeTags(html);
      html = this.removeAttrs(html);
      html = normalizeWhitespace(html);
      html = this.transformEncoding(html);
      html = this.https2http(html);

      return html;
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
