import normalizeWhitespace from 'normalize-html-whitespace';

export class Downcycle
{
  constructor(dom, tools)
  {
    this.dom = dom;
    this.tools = tools;
  }

  async get(origHtml)
  {
    try
    {
      let html = '';
      let doc = (new this.dom(origHtml)).window.document;

      doc = this.removeTags(doc);
      doc = this.removeAttrs(doc);
      html = doc.documentElement.outerHTML;
      html = normalizeWhitespace(html);
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
      tagsFound.forEach((tagFound) => {
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
      attrs.forEach((attr) => {
        if (el.hasAttribute(attr)) {
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

  https2http(html)
  {
    html = html.replace(/https\:\/\//gi, 'http://');
    return html;
  }
}
