import fs                   from 'fs/promises';
import fsSync               from 'fs';
import os                   from 'os';
import chardet              from 'chardet';
import { TsvImp }           from '../lb/TsvImp.js';

import fetch                from 'node-fetch';
import { Request }          from 'node-fetch';


export async function loadPrefs()
{
  let prefs = {};
  let homedir = os.homedir()+'/.feedProxy/';
  let rssHintTableFile = homedir+'feedProxySheet.csv';
  let prefsFile = homedir+'prefs.json';

  if (!fsSync.existsSync(rssHintTableFile))
  {
    rssHintTableFile = './config/feedProxySheet.csv';
  }

  if (!fsSync.existsSync(prefsFile))
  {
    prefsFile = './config/prefs.json';
  }

  prefs = JSON.parse(await readFile(prefsFile));

  const rawTable = await readFile(rssHintTableFile);
  prefs.rssHintTable = new TsvImp().fromTSV(rawTable);

  Object.freeze(prefs);

  return prefs;
}

// retro fetch with Request object, our core function
export async function rFetchUrlCore(req)
{
  let response = null;
  try
  {
    cLog('loading', req.url);
    response = await fetch(req);
    return response;
  }
  catch (error)
  {
    // fallback from https to http
    const url = req.url.replace(/^https:/i, 'http:');
    req = await cloneRequest(url, req);

    cLog('HTTPS failed, falling back to HTTP', url);
    try
    {
      response = fetch(req);
      return response;
    }
    catch (error)
    {
      cLog('loading failed with HTTPS and HTTP for', req.url, error);
      throw error;
    }
  }
}

export async function rFetchUrlText(url, srcReq)
{
  let data = null;

  const newReq = await cloneRequest(url, srcReq);
  const response = await rFetchUrlCore(newReq);
  data = await response.arrayBuffer();
  data = Buffer.from(new Uint8Array(data));

  const encoding = chardet.detect(data);
  const decoder = new TextDecoder(encoding);
  data = decoder.decode(data);

  return data;
}

export async function rFetchUrl(url, headers = null)
{
  const tgtReq = new Request(url, { headers: headers });

  return await rFetchUrlCore(tgtReq);
}

export async function cloneRequest(url, srcReq)
{
  let result = null;

  if (srcReq.method === 'POST')
  {
    result = await new Promise((resolve, reject) =>
    {
      let body = [];
      srcReq.on('data', chunk => body.push(chunk));
      srcReq.on('end', () =>
      {
        body = Buffer.concat(body).toString();

        const newReq = new Request(url, {
          method: 'POST',
          headers:  srcReq.headers,
          body: body
        });

        resolve(newReq);
      });
    });
  }
  else
  {
    result = new Request(url);
  }

  return result;
}

export async function isRss(url)
{
  try
  {
    const response = await rFetchUrl(url, {method: 'HEAD'});
    return (response.ok && response.headers.get('content-type').includes('xml'));
  }
  catch (err)
  {
    console.log(err);
    return false;
  }
}

/*
  throws error!
*/
export async function getMimeType(url)
{
  const response = await rFetchUrl(url, {method: 'HEAD'});
  return response.headers.get('content-type').toString().toLowerCase();
}

export function reworkURL(url)
{
  url = url.replace(/^http:/i, 'https:');
  url = url.replace(/:[\d]{2,4}\//, '/'); //remove port
  url = url.replace(/\/$/, ''); // remove trailing slash

  return url;
}

export function tldFromUrl(url)
{
  const p = new URL(url);
  const protocol = (p.protocol != null) ? p.protocol : 'http:';
  const tld = (protocol + '//' + p.host).toLowerCase();

  return tld;
}

export async function readFile(filePath)
{
  try
  {
    const data = await fs.readFile(filePath);
    return data.toString();
  }
  catch (error)
  {
    console.error(`Got an error trying to read the file: ${error.message}`);
  }
}

export async function getPublicIP()
{
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  }
  catch (error)
  {
    console.error('Error determining the public IP:', error);
  }
}

export function getLocalIP()
{
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces))
  {
    for (const iface of interfaces[name])
    {
      const {address, family, internal} = iface;
      if (family === 'IPv4' && !internal)
      {
        return address;
      }
    }
  }
  return null;
}

// conditional logging
export function cLog(...args)
{
  if (globalThis.verboseLogging)
  {
    console.log(...args);
  }
}