// foreign modules, heaven/hell
import os                   from 'os';
import process              from 'process';
import * as http            from 'http';

// Our own modules
import * as tools           from './lb/Tools.js';
import { ControlC }         from './ct/ControlC.js';

class App
{
  constructor(port, logging)
  {
    this.pAdress = 'http://localhost:'+port.toString()+'/';
    this.homedir = os.homedir()+'/.feedProxy/';

    tools.log.verbose = logging;
  }

  async init()
  {
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

  async router(request, response)
  {
    let url = request.url;
    let tld = '';
    let wasProcessed = false;
    const feedProxy = new URL(url).searchParams.get('feedProxy');

    url = tools.reworkURL(this.pAdress, url);
    tld = tools.tldFromUrl(url);

    console.log('working on request', url);

    if (!url.includes('favicon.ico'))
    {
      // image - proxy image, convert to GIF
      if ((wasProcessed === false) &&
          (await tools.isImage(url)))
      {
        wasProcessed = await this.cntrl.imageProxyC(response, url);
      }

      // Process TLD
      if ((wasProcessed === false) &&
          (url == tld))
      {
        wasProcessed = await this.cntrl.tldC(response, url);
      }

      // Preview (show article extract)
      if ((wasProcessed === false) &&
          (feedProxy === 'articleLoad'))
      {
        wasProcessed = await this.cntrl.previewC(response, url);
      }

      // do passthrough or show overload warning screen
      if (wasProcessed === false)
      {
        wasProcessed = await this.cntrl.passthroughC(response, url, feedProxy);
      }
    }

    // is something else (favicon...): return empty, works best.
    if (wasProcessed === false)
    {
      wasProcessed = this.cntrl.emptyC(response, url);
    }

    console.log('done with request', url);
    console.log('');
  }
}

const hostname = '0.0.0.0';
const port = (process.argv[2] !== undefined) ? process.argv[2] : 8080;
const logging = (process.argv[3] == '-v') ? true : false;
const app = new App(port, logging);

const server = http.createServer(app.router.bind(app));
server.listen(port, hostname, app.init.bind(app));