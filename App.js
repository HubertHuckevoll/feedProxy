// foreign modules
import process              from 'process';
import * as http            from 'http';

// Our own modules
import * as tools           from './lb/Tools.js';
import { ControlC }         from './ct/ControlC.js';
import { Payload }          from './lb/Payload.js';

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
    console.log('Local IP:', tools.getLocalIP()+':'+port);
    console.log('Verbose logging:', (globalThis.verboseLogging === true) ? 'on' : 'off');
    console.log('Cobbled together by MeyerK 2022/10ff.');
    console.log('Running, waiting for requests.');
    console.log();
  }

  async router(request, response)
  {
    try
    {
      const payload = await new Payload(this.cntrl.prefs).get(request, response);
      console.log('working on request', payload);

      /*
      if (payload.url == 'https://www.geos-infobase.de/SSHOT450/rotate.php')
      {
        payload.url = 'https://www.geos-infobase.de/STIL/LOGO05.GIF';
      }
      */

      await this.cntrl.run(request, response, payload);

      console.log('done with request', payload.url);
      console.log('');
    }
    catch (e)
    {
      console.log('ERROR', e);
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end('');
    }
  }
}

const app = new App();
const server = http.createServer(app.router.bind(app));
server.listen(port, hostname, app.init.bind(app));