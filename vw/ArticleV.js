import { BaseV }                           from '../vw/BaseV.js';

export class ArticleV extends BaseV
{
  draw(res, pl, artObj)
  {
    try
    {
      let html = '';
      html = this.renderReadable(artObj);
      html = this.prepareHTML(html);

      res.writeHead(200, {'Content-Type': pl.mimeType});
      res.end(html);
    }
    catch(err)
    {
      console.log(err);
    }
  }

  renderReadable(artObj)
  {
    let html = '';
    html += this.openPage();
    html += '<h1>'+artObj.title+'</h1>';
    html += (artObj.image) ? '<img src="'+artObj.image+'"><br>' : '';
    html += (artObj.excerpt) ? '<p>'+artObj.excerpt+'</p>' : '';
    html += (artObj.byline) ? '<p><em>'+artObj.byline+'</em></p>' : '';
    html += '<hr>';
    html += (artObj.content) ? artObj.content : '';
    html += this.closePage();

    return html;
  }

}