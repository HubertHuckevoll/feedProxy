export class Upcycle
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
      const doc = (new this.dom(origHtml)).window.document;
      const tags = ['script', 'style', 'link'];
      const attrs = ['class', 'style'];

      tags.forEach((tag) =>
      {
        const tagsFound = doc.querySelectorAll(tag);
        tagsFound.forEach((tagFound) => {
          tagFound.parentNode.removeChild(tagFound);
        });
      });

      const els = doc.querySelectorAll('*');
      els.forEach((el) => {
        attrs.forEach((attr) => {
          if (el.hasAttribute(attr)) {
            el.removeAttribute(attr);
          }
        });
      });

      const html = doc.documentElement.outerHTML;
      return html;
    }
    catch(err)
    {
      throw(err);
    }
  }
}
