import { BaseV }             from '../vw/BaseV.js';
import {JSDOM}               from 'jsdom';
import fsSync                from 'fs';
import * as tools            from '../lb/tools.js';

export class StrippedV extends BaseV
{
  draw(res, pl, html)
  {
    try
    {
      if (globalThis.prefs.downcyclePutInHTML4Box == true)
      {
        let doc = new JSDOM(html).window.document;
        html = this.openPage() + doc.documentElement.querySelector('body').innerHTML + this.closePage();
      }

      html = this.prepareHTML(html);

      tools.cLogFile('./output.txt', html);

      res.writeHead(200, {'Content-Type': pl.mimeType, 'Content-Length' : html.length});
      res.end(html);
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
