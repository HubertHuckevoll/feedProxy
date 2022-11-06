import * as http        from 'http';
import { OverviewC }    from './_c/OverviewC.js';
import { FeedContentC } from './_c/FeedContentC.js';
import { PreviewC }     from './_c/PreviewC.js';
import { ImageProxyC }  from './_c/ImageProxyC.js';
import { PassthroughC } from './_c/PassthroughC.js';
import { EmptyC }       from './_c/EmptyC.js';
import { Html3V }       from './_v/Html3V.js';
import { TsvImp }       from './_l/TsvImp.js';
import * as tools       from './_l/Tools.js';

class App
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
    this.emptyC = new EmptyC();
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
        wasProcessed = await this.passthroughC.get(request, response, url);
      }

      // is image - proxy image, convert to to GIF
      if ((wasProcessed === false) &&
          (await tools.isImage(url)))
      {
        wasProcessed = await this.imageProxyC.get(response, url);
      }

      // is RSS - show feed content
      if ((wasProcessed === false) &&
          (await tools.isRss(url)))
      {
        wasProcessed = await this.feedContentC.get(response, url);
      }

      // is "homepage" - show overwiew
      if ((wasProcessed === false) &&
          (url == tld))
      {
        wasProcessed = await this.overviewC.get(response, url);
      }

      // referer is RSS - show article extract
      if ((wasProcessed === false) &&
          (await tools.isRss(referer)))
      {
        wasProcessed = await this.previewC.get(response, url);
      }
    }

    // is something else: return empty (works best...)
    if (wasProcessed === false)
    {
      wasProcessed = this.emptyC.get(response);
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