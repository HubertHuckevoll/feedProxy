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

  console.log('// feedProxy //');
  console.log('Local IP:', tools.getLocalIP()+':'+port);
  console.log('Verbose logging:', (globalThis.prefs.verboseLogging === true) ? 'on' : 'off');
  console.log('Cobbled together by MeyerK 2022/10ff.');
  console.log('Running, waiting for requests.');
  console.log();
}

async function router(request, response)
{
  let pl = null;
  let wasProcessed = false;

  try
  {
    pl = await payload.get(request, response);
  }
  catch (e)
  {
    console.log('ERROR fetching request', e);
    wasProcessed = cntrl.emptyC(request, response);
    console.log('');
    console.log('');

    return;
  }

  logRequest(pl);

  wasProcessed = await cntrl.run(request, response, pl);
  console.log('DONE with request', pl.url, 'exit state was:', wasProcessed);
  console.log('');
  console.log('');
}

function logRequest(pl)
{
  const plLogClone = Object.assign({}, pl);
  if (plLogClone.html !== null)
  {
    if (globalThis.prefs.verboseLogging == true)
    {
      tools.cLogFile('./input.html', plLogClone.html);
    }
    plLogClone.html = plLogClone.html.substr(0, 250) + '...';
  }
  console.log('WORKING on request', plLogClone);
}

const server = http.createServer(router.bind(globalThis));
server.listen(port, hostname, init.bind(globalThis));