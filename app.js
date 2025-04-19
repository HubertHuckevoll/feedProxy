// foreign modules
import * as http            from 'http';

// Our own modules
import * as tools           from './lb/tools.js';
import * as cntrl           from './ct/controlC.js';
import * as payload         from './lb/payload.js';

// Globals
const hostname = '0.0.0.0';
const port = (process.argv[2] !== undefined) ? process.argv[2] : 8080;

async function init()
{
  globalThis.prefs = await tools.loadPrefs();

  console.log('/* feedProxy */');
  console.log('Local IP:', tools.getLocalIP()+':'+port);
  console.log('Verbose logging:', (globalThis.prefs.verboseLogging === true) ? 'on' : 'off');
  console.log('Cobbled together by MeyerK 2022/10ff.');
  console.log('Running, waiting for requests.');
  console.log();
  tools.cLog('PREFS loaded:', globalThis.prefs);
}

async function router(request, response)
{
  let pl = null;
  let wasProcessed = false;

  try
  {
    pl = await payload.getPayload(request, response);
    console.log('SUCCESS fetching request', pl.url);
  }
  catch (e)
  {
    console.log('ERROR fetching request', e);
    wasProcessed = cntrl.emptyC(request, response);
    console.log('');
    console.log('');

    return;
  }

  try
  {
    wasProcessed = await cntrl.run(request, response, pl);
    console.log('DONE with request', pl.url);
  }
  catch(err)
  {
    console.log('ERROR processing request', err);
    wasProcessed = cntrl.emptyC(request, response);
  }

  console.log('');
  console.log('');
}

const server = http.createServer(router.bind(globalThis));
server.listen(port, hostname, init.bind(globalThis));