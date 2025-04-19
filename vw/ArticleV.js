import { BaseV }             from '../vw/BaseV.js';
import * as tools            from '../lb/tools.js'

export class ArticleV extends BaseV
{
  async draw(res, pl, artObj)
  {
    try
    {
      let html = '';

      html = this.renderReadable(artObj, pl.url);
      html = this.prepareHTML(html);

      await tools.cLogFile('./output.html', html);

      res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length' : html.length});
      res.end(html);
    }
    catch(err)
    {
      console.log(err);
    }
  }

  renderReadable(artObj, url)
  {
    const strippedUrl = this.setUrlFeedProxyParam(url, 'lP');

    let html = '';
    html += this.openPage(url);
    html += '<small>[<a href="'+strippedUrl+'">Stripped Page View</a>]</small>';
    html += '<hr>';
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