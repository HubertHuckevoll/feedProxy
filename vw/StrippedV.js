import { BaseV }             from '../vw/BaseV.js';

export class StrippedV extends BaseV
{
  draw(pageObj)
  {
    try
    {
      let html = '';
      html = pageObj.content;
      html = this.prepareHTML(html);
      return html;
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
