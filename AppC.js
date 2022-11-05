import { serve }        from "https://deno.land/std@0.161.0/http/server.ts";
import { OverviewC }    from './_c/OverviewC.js';
import { FeedContentC } from './_c/FeedContentC.js';
import { PreviewC }     from './_c/PreviewC.js';
import { ImageProxyC }  from './_c/ImageProxyC.js';
import { PassthroughC } from './_c/PassthroughC.js';
import { Html3V }       from './_v/Html3V.js';
import { TsvImp }       from './_l/TsvImp.js';
import * as tools       from './_l/Tools.js';

class AppC
{
  constructor(port)
  {
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.rssHintTableAddress = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTToY09sxeo57zbb-5hXF7ElwI6NaDACTWx_itnF4yVV9j1V_s-H3FTCKP8a17K22tzLFazhCcO82uL/pub?output=tsv';
    this.rssHintTable = null;

    this.view = new Html3V();
    this.feedContentC = new FeedContentC(this.view);
    this.imageProxyC = new ImageProxyC();
    this.previewC = new PreviewC(this.view);
    this.passthroughC = new PassthroughC(this.view);
  }

  async init()
  {
    const res = await fetch(this.rssHintTableAddress);
    if (res.ok)
    {
      const rawTable = await res.text();
      this.rssHintTable = new TsvImp().fromTSV(rawTable);
      this.overviewC = new OverviewC(this.view, this.rssHintTable);

    }
    console.log('*** feedProxy ***');
  }

  async handler(request)
  {
    let response = null;
    let url = request.url;
    let tld = '';
    const referer = request.headers.get('referer');

    if (url.startsWith(this.pAdress))
    {
      //this.view.setNonProxyMode(true); //FIXME this is buggy as hell
      console.log('Non-Proxy Mode detected.');
    }

    if (!url.includes('favicon.ico'))
    {
      url = tools.reworkURL(this.pAdress, url);
      console.log('____________________________________________________');
      console.log('URL (reworked): ', url);
      tld = tools.tldFromUrl(url);

      // passthrough
      if (url.includes('geos-infobase')) //FIXME: add mode for viewing original page
      {
        response = this.passthroughC.get(url, request);
      }

      // is image - proxy image, convert to to GIF
      if ((response === null) &&
          (await tools.isImage(url)))
      {
        response = this.imageProxyC.get(url, request);
      }

      // is RSS - show feed content
      if ((response === null) &&
          (await tools.isRss(url)))
      {
        response = this.feedContentC.get(url);
      }

      // is "homepage" - show overwiew
      if ((response === null) &&
          (url == tld))
      {
        response = this.overviewC.get(url);
      }

      // referer is RSS - show article extract
      if ((response === null) &&
          (await tools.isRss(referer)))
      {
        response = this.previewC.get(url);
      }
    }

    // is something else: return empty (works best!)
    if (response === null)
    {
      response = this.view.drawEmpty();
    }

    return response;
  }
}
const port = 8080;
const app = new AppC(port);
await app.init();
await serve(app.handler.bind(app), { port: port });
