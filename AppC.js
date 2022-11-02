import { serve } from "https://deno.land/std@0.161.0/http/server.ts";
import { OverviewC } from './_c/OverviewC.js';
import { FeedContentC } from './_c/FeedContentC.js';
import { PreviewC } from './_c/PreviewC.js';
import { Tools } from './_l/Tools.js';
import { Html3V } from './_v/Html3V.js';
import { TsvImp }   from './_l/TsvImp.js';
import { ImageProxyC } from './_c/ImageProxyC.js';

class AppC
{
  constructor(port)
  {
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.rssHintTable = null;
  }

  async init()
  {
    const rssHintTableAddress = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTToY09sxeo57zbb-5hXF7ElwI6NaDACTWx_itnF4yVV9j1V_s-H3FTCKP8a17K22tzLFazhCcO82uL/pub?output=tsv';
    const res = await fetch(rssHintTableAddress);
    if (res.ok)
    {
      const rawTable = await res.text();
      this.rssHintTable = new TsvImp().fromTSV(rawTable);
    }
    console.log('*** feedProxy ***');
  }

  async handler(request)
  {
    let response = null;
    let url = request.url;
    let tld = '';
    const referer = request.headers.get('referer');
    let nonProxyMode = false; // FIXME: pass to view to create a non-proxy mode later
    const tools = new Tools();
    const view = new Html3V();

    console.log('Originally requested URL: ', url);

    if (url.startsWith(this.pAdress))
    {
      nonProxyMode = true;
      console.log('Non-Proxy Mode detected.');
    }

    url = tools.reworkURL(this.pAdress, url);
    tld = tools.tldFromUrl(url);
    console.log('Reworked URL: ', url);
    console.log('TLD: ', tld);

    if (!url.includes('favicon.ico'))
    {
      if (await tools.isRss(url))
      {
        response = await new FeedContentC(view).get(url);
      }
      else
      {

      /*
      if (response === null)
      {
        if (await tools.isImage(url))
        {
          response = new ImageProxyC().get(url, request);
        }
      }
      */

        if (
            (url.includes('meyerk.com')) ||
            (url.includes('hasenbuelt'))
           )
        {
          const newReq = new Request(url, request);
          response = fetch(newReq);
        }
        else
        {
          if (url == tld)
          {
            response = await new OverviewC(view, this.rssHintTable).get(url);
          }
          else
          {
            if (await tools.isRss(referer))
            {
              response = await new PreviewC(view).get(url);
            }
            else
            {
              response = view.drawEmpty();
            }
          }
        }
      }
    }

    if (response == null)
    {
      response = view.drawError('The content of this webpage can\'t be displayed.');
    }

    return response;
  }
}
const port = 8080;
const app = new AppC(port);
await app.init();
await serve(app.handler.bind(app), { port: port });
