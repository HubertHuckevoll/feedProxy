import { BaseV }             from '../vw/BaseV.js';

export class StrippedV extends BaseV
{
  draw(html)
  {
    try
    {
      html = this.prepareHTML(html);
      return html;
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
