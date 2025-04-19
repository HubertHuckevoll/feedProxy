import { BaseV }             from '../vw/BaseV.js';
import * as tools            from '../lb/tools.js';

export class StrippedV extends BaseV
{
  async draw(res, pl, html)
  {
    try
    {
      if (globalThis.prefs.downcyclePutInHTML4Box == true)
      {
        html = this.openPage(pl.url) + html + this.closePage();
      }

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
}
