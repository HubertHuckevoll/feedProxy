import { serve }        from "https://deno.land/std@0.161.0/http/server.ts";
import { OverviewC }    from './_c/OverviewC.js';
import { FeedContentC } from './_c/FeedContentC.js';
import { PreviewC }     from './_c/PreviewC.js';
import { ImageProxyC }  from './_c/ImageProxyC.js';
import { PassthroughC } from './_c/PassthroughC.js';
import * as tools       from './_l/Tools.js';
import { Html3V }       from './_v/Html3V.js';
import { TsvImp }       from './_l/TsvImp.js';


class AppC
{
  constructor(port)
  {
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.rssHintTable = null;

    this.nonProxyMode = false;

    this.view = new Html3V();
    this.feedContentC = new FeedContentC(this.view);
    this.imageProxyC = new ImageProxyC();
    this.previewC = new PreviewC(this.view);
    this.passthroughC = new PassthroughC(this.view);
  }

  async init()
  {
    const rssHintTableAddress = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTToY09sxeo57zbb-5hXF7ElwI6NaDACTWx_itnF4yVV9j1V_s-H3FTCKP8a17K22tzLFazhCcO82uL/pub?output=tsv';
    const res = await fetch(rssHintTableAddress);
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
      this.nonProxyMode = true;
      console.log('Non-Proxy Mode detected.');
    }

    url = tools.reworkURL(this.pAdress, url);
    console.log('____________________________________________________');
    console.log('URL (reworked): ', url);

    tld = tools.tldFromUrl(url);

    if (!url.includes('favicon.ico'))
    {
      if (url.includes('geos-infobase')) //FIXME: make whitelist
      {
        response = this.passthroughC.get(url, request);
      }

      if ((response === null) &&
          (await tools.isImage(url)))
      {
        response = this.imageProxyC.get(url, request);
      }

      if ((response === null) &&
          (await tools.isRss(url)))
      {
        response = this.feedContentC.get(url);
      }

      if ((response === null) &&
          (url == tld))
      {
        response = this.overviewC.get(url);
      }

      if ((response === null) &&
          (await tools.isRss(referer)))
      {
        response = this.previewC.get(url);
      }

      if (response === null)
      {
        response = this.view.drawEmpty();
      }
    }

    return response;
  }
}
const port = 8080;
const app = new AppC(port);
await app.init();
await serve(app.handler.bind(app), { port: port });
