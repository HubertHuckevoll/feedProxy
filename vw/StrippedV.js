import { BaseV }             from '../vw/BaseV.js';

export class StrippedV extends BaseV
{
  draw(res, pl, html)
  {
    try
    {
      html = this.prepareHTML(html);
      res.writeHead(200, {'Content-Type': pl.mimeType});
      res.end(html);
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
