import { JSDOM as dom }    from 'jsdom';
import normalizeWhitespace from 'normalize-html-whitespace';
import { BaseV }           from '../vw/BaseV.js';

export class DowncycleV extends BaseV
{
  constructor(prefs)
  {
    super();
    this.prefs = prefs;
  }

  async draw(origHtml)
  {
    try
    {
      let html = '';
      let doc = (new dom(origHtml)).window.document;

      doc = this.removeTags(doc);
      doc = this.removeAttrs(doc);
      html = doc.documentElement.outerHTML;
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

  removeTags(doc)
  {
    const tags = ['script', 'style', 'link', 'svg', 'video', 'audio', 'object', 'embed'];

    tags.forEach((tag) =>
    {
      const tagsFound = doc.querySelectorAll(tag);
      tagsFound.forEach((tagFound) =>
      {
        tagFound.parentNode.removeChild(tagFound);
      });
    });

    return doc;
  }

  removeAttrs(doc)
  {
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

    return doc;
  }

}
