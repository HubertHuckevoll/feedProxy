import { JSDOM as dom }                         from 'jsdom';
import { isProbablyReaderable as isReaderable } from '@mozilla/readability';
import { Readability as articleExtractor }      from '@mozilla/readability';
import normalizeWhitespace                      from 'normalize-html-whitespace';
import { BaseV }                                from '../vw/BaseV.js';

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
      const doc = new dom(html, {url: this.url});
      if (isReaderable(doc.window.document))
      {
        let reader = new articleExtractor(doc.window.document);
        let artObj = reader.parse();
        html = this.renderReadable(artObj);
      }
      else
      {
        html = this.removeTags(html);
        html = this.removeAttrs(html);
        html = normalizeWhitespace(html);
      }

      html = this.prepareHTML(html)

      return html;
    }
    catch(err)
    {
      throw(err);
    }
  }

  renderReadable(artObj)
  {
    let html = '';
    html += (artObj.title) ? this.openPage() : '';
    html += (artObj.title) ? '<h1>'+artObj.title+'</h1>' : '';
    html += (artObj.image) ? '<img src="'+artObj.image+'"><br>' : '';
    html += (artObj.excerpt) ? '<p>'+artObj.excerpt+'</p>' : '';
    html += (artObj.title) ? '<hr>' : '';
    html += (artObj.content) ? artObj.content : '';
    html += (artObj.title) ? this.closePage() : '';

    return html;
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
