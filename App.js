// foreign modules
import process              from 'process';
import * as http            from 'http';

// Our own modules
import * as tools           from './lb/Tools.js';
import { ControlC }         from './ct/ControlC.js';

// Globals
const hostname = '0.0.0.0';
const port = (process.argv[2] !== undefined) ? process.argv[2] : 8080;
globalThis.verboseLogging = (process.argv[3] == '-v') ? true : false;

class App
{
  async init()
  {
    this.cntrl = new ControlC();
    this.cntrl.init();

    console.log('***feedProxy***');
    console.log('Bound to '+hostname+':'+port);
    console.log('Local IP:', tools.getLocalIP());
    console.log('Verbose logging:', (globalThis.verboseLogging === true) ? 'on' : 'off');
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

    url = tools.reworkURL(url);
    tld = tools.tldFromUrl(url);

    console.log('working on request', url);
    const mimeType = await tools.getMimeType(url);

    // image - proxy image, convert to GIF if not GIF yet
    if (wasProcessed === false)
    {
      wasProcessed = await this.cntrl.imageProxyC(response, mimeType, url);
    }

    // Process top level domain as feed, if one exists
    if (wasProcessed === false)
    {
      wasProcessed = await this.cntrl.indexAsFeedC(response, tld, url);
    }

    // do downcycle, passthrough or show overload warning screen
    if (wasProcessed === false)
    {
      wasProcessed = await this.cntrl.pageC(response, url, mimeType, feedProxy);
    }

    // if not processed, passthru - hopefully just big text files or binary downloads...
    if (wasProcessed === false)
    {
      wasProcessed = await this.cntrl.passthroughC(response, url, mimeType, feedProxy);
    }

    // if still not processed (error...?): return empty, works best.
    if (wasProcessed === false)
    {
      wasProcessed = this.cntrl.emptyC(response, url, mimeType);
    }

    console.log('done with request', url);
    console.log('');
  }
}

const app = new App();
const server = http.createServer(app.router.bind(app));
server.listen(port, hostname, app.init.bind(app));