import { Readability as articleExtractor } from '@mozilla/readability';
import { JSDOM as dom }                    from 'jsdom';
import { BaseV }                           from '../vw/BaseV.js';

export class ArticleV extends BaseV
{
  async draw(html)
  {
    try
    {
      const doc = new dom(html, {url: this.url});
      let reader = new articleExtractor(doc.window.document);
      let artObj = reader.parse();

      html = this.renderReadable(artObj);
      html = this.prepareHTML(html);

      return html;
    }
    catch(err)
    {
      console.log(err);
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

}