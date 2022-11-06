import * as http        from 'http';
import { TsvImp }       from './_l/TsvImp.js';
import * as tools       from './_l/Tools.js';
import * as cntrl       from './_c/Control.js';
import { Html3V }       from './_v/Html3V.js';

class App
{
  constructor(port)
  {
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.rssHintTableAddress = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTToY09sxeo57zbb-5hXF7ElwI6NaDACTWx_itnF4yVV9j1V_s-H3FTCKP8a17K22tzLFazhCcO82uL/pub?output=tsv';
    this.rssHintTable = null;
    this.view = new Html3V();
  }

  async init()
  {
    const res = await fetch(this.rssHintTableAddress);
    if (res.ok)
    {
      const rawTable = await res.text();
      this.rssHintTable = new TsvImp().fromTSV(rawTable);
    }
  }

  async handler(request, response)
  {
    let url = request.url;
    let tld = '';
    const referer = request.headers['referer'];
    let wasProcessed = false;

    if (!url.includes('favicon.ico'))
    {
      url = tools.reworkURL(this.pAdress, url);
      console.log('____________________________________________________');
      console.log('URL (reworked): ', url);
      tld = tools.tldFromUrl(url);

      // passthrough
      if (url.includes('geos-infobase')) //FIXME: add mode for viewing original page
      {
        wasProcessed = await cntrl.passthroughC(request, response, url);
      }

      // is image - proxy image, convert to to GIF
      if ((wasProcessed === false) &&
          (await tools.isImage(url)))
      {
        wasProcessed = await cntrl.imageProxyC(response, url);
      }

      // is RSS - show feed content
      if ((wasProcessed === false) &&
          (await tools.isRss(url)))
      {
        wasProcessed = await cntrl.feedContentC(this.view, response, url);
      }

      // is "homepage" - show overwiew
      if ((wasProcessed === false) &&
          (url == tld))
      {
        wasProcessed = await cntrl.overviewC(this.view, this.rssHintTable, response, url);
      }

      // referer is RSS - show article extract
      if ((wasProcessed === false) &&
          (await tools.isRss(referer)))
      {
        wasProcessed = await cntrl.previewC(this.view, response, url);
      }
    }

    // is something else: return empty (works best...)
    if (wasProcessed === false)
    {
      wasProcessed = cntrl.emptyC(response);
    }
  }
}

const hostname = '0.0.0.0';
const port = 8080;
const app = new App(port);
await app.init();

const server = http.createServer(app.handler.bind(app));
server.listen(port, hostname, () =>
{
  console.log('***feedProxy***');
  console.log('running at http://'+hostname+':'+port+'/');
});