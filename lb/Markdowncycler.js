import { JSDOM as dom }                         from 'jsdom';
import normalizeWhitespace                      from 'normalize-html-whitespace';
import html2md                                  from 'turndown';
import md2html                                  from 'showdown';

export class Markdowncycler
{
  constructor(url, html, prefs)
  {
    this.url = url;
    this.html = html;
    this.prefs = prefs;
  }

  getStrippedPage()
  {
    let md = '';
    let htm = '';

    htm = this.removeTags(this.html, false);
    htm = this.removeAttrs(htm, false);
    htm = this.boxImages(htm, true);

    let turndownService = new html2md();
    md = turndownService.turndown(htm);

    let converter = new md2html.Converter();
    htm       = converter.makeHtml(md);

    htm = normalizeWhitespace(htm);
    return htm;
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
