// foreign modules
import process              from 'process';
import * as http            from 'http';

// Our own modules
import * as tools           from './lb/tools.js';
import { ControlC }         from './ct/ControlC.js';
import * as payload         from './lb/payload.js';

// Globals
const hostname = '0.0.0.0';
const port = (process.argv[2] !== undefined) ? process.argv[2] : 8080;
globalThis.verboseLogging = (process.argv[3] == '-v') ? true : false;

class App
{
  async init()
  {
    this.cntrl = new ControlC();

    globalThis.prefs = await tools.loadPrefs();

    console.log('// feedProxy //');
    console.log('Local IP:', tools.getLocalIP()+':'+port);
    console.log('Verbose logging:', (globalThis.verboseLogging === true) ? 'on' : 'off');
    console.log('Cobbled together by MeyerK 2022/10ff.');
    console.log('Running, waiting for requests.');
    console.log();
  }

  async router(request, response)
  {
    let pl = null;
    let wasProcessed = false;

    try
    {
      pl = await payload.get(request, response);
    }
    catch (e)
    {
      console.log('error fetching request', e);
      this.cntrl.emptyC(request, response);
      console.log('');

      return;
    }

    const plLogClone = Object.assign({}, pl);
    if ((plLogClone.html !== undefined) && (globalThis.verboseLogging == false))
    {
      plLogClone.html = plLogClone.html.substr(0, 500) + '...';
    }
    console.log('working on request', plLogClone);

    wasProcessed = await this.cntrl.run(request, response, pl);
    if (wasProcessed)
    {
      console.log('done with request', pl.url);
    }
    else
    {
      console.log('unknown error processing request', pl.url, '(returning empty).');
    }
    console.log('');
  }
}

const app = new App();
const server = http.createServer(app.router.bind(app));
server.listen(port, hostname, app.init.bind(app));