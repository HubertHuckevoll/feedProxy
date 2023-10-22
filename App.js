// foreign modules, heaven/hell
import os                   from 'os';
import fs                   from 'fs';
import process              from 'process';
import * as http            from 'http';

// Our own modules
import * as tools           from './lb/Tools.js';
import { ControlC }         from './ct/ControlC.js';

class App
{
  constructor(port, logging)
  {
    this.blackList = null;
    this.blackListFile = null;
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.homedir = os.homedir()+'/.feedProxy/';

    tools.log.verbose = logging;
  }

  async init()
  {

    this.blackListFile = this.homedir+'feedProxyBlacklist.json';
    if (!fs.existsSync(this.blackListFile))
    {
      this.blackListFile = './config/feedProxyBlacklist.json';
    }
    this.blackList = JSON.parse(await tools.readFile(this.blackListFile));

    this.cntrl = new ControlC(tools);
    this.cntrl.init();

    console.log('***feedProxy***');
    console.log('Bound to '+hostname+':'+port);
    console.log('Public IP:', await tools.getPublicIP());
    console.log('Local IP:', tools.getLocalIP());
    console.log('Verbose logging:', (tools.log.verbose === true) ? 'on' : 'off');
    console.log('Cobbled together by MeyerK 2022/10ff.');
    console.log('Running, waiting for requests (hit Ctrl+C to exit).');
    console.log();
  }

  UrlIsInBlacklist(url)
  {
    let ret = false;
    this.blackList.passthrough.forEach((entry) =>
    {
      if (url.includes(entry.service))
      {
        ret = true;
      }
    });

    return ret;
  }

  async router(request, response)
  {
    let url = request.url;
    let tld = '';

    const referer = request.headers['referer'];
    let wasProcessed = false;

    if (!url.includes('favicon.ico'))
    {
      url = tools.reworkURL(this.pAdress, url);
      tld = tools.tldFromUrl(url);

      // passthrough
      if (this.UrlIsInBlacklist(url))
      {
        wasProcessed = await this.cntrl.passthroughC(request, response, url);
      }

      // image - proxy image, convert to GIF
      if ((wasProcessed === false) &&
          (await tools.isImage(url)))
      {
        wasProcessed = await this.cntrl.imageProxyC(response, url);
      }

      // feedContent - RSS
      if ((wasProcessed === false) &&
          (await tools.isRss(url)))
      {
        wasProcessed = await this.cntrl.feedContentC(response, url);
      }

      // Overview - our "homepage"
      if ((wasProcessed === false) &&
          (url == tld))
      {
        wasProcessed = await this.cntrl.overviewC(response, url);
      }

      // Preview (referer is RSS - show article extract)
      if ((wasProcessed === false) &&
          (await tools.isRss(referer)))
      {
        wasProcessed = await this.cntrl.previewC(response, url);
      }
    }

    // is something else: return empty (works best...)
    if (wasProcessed === false)
    {
      wasProcessed = this.cntrl.emptyC(response, url);
    }
  }
}

const hostname = '0.0.0.0';
const port = (process.argv[2] !== undefined) ? process.argv[2] : 8080;
const logging = (process.argv[3] == '-v') ? true : false;
const app = new App(port, logging);

const server = http.createServer(app.router.bind(app));
server.listen(port, hostname, app.init.bind(app));