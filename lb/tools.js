import fs                   from 'fs/promises';
import fsSync               from 'fs';
import os                   from 'os';
import process              from 'process';
import chardet              from 'chardet';
import * as tsvImp          from './tsvImp.js';
import { JSDOM }            from 'jsdom';

import fetch                from 'node-fetch';
import { Request }          from 'node-fetch';


export async function loadPrefs()
{
  let prefs = {};
  let homedir = os.homedir()+'/.feedProxy/';

  let rssHintTableFile = homedir+'feedProxySheet.csv';
  let prefsFile = homedir+'prefs.json';
  let adblockFile = homedir+'adblock.txt';

  if (!fsSync.existsSync(rssHintTableFile)) rssHintTableFile = './config/feedProxySheet.csv';
  if (!fsSync.existsSync(prefsFile)) prefsFile = './config/prefs.json';
  if (!fsSync.existsSync(adblockFile)) adblockFile = './config/adblock.txt';

  prefs = JSON.parse(await readFile(prefsFile));

  const rawTable = await readFile(rssHintTableFile);
  prefs.rssHintTable = tsvImp.fromTSV(rawTable);

  prefs.adblock = await readFile(adblockFile);

  prefs.verboseLogging = (process.argv[3] == '-v') ? true : false;

  Object.freeze(prefs);

  return prefs;
}

// retro fetch with Request object, our core function
export async function rFetchUrlCore(req)
{
  const conTimeout = 15000;
  let response = null;

  try
  {
    response = await fetch(req, {
      signal: AbortSignal.timeout(conTimeout),
    });
    return response;
  }
  catch (error)
  {
    // fallback from https to http
    const url = req.url.replace(/^https:/i, 'http:');
    req = await cloneRequest(url, req);

    cLog('HTTPS failed, falling back to HTTP', url, error);
    try
    {
      response = await fetch(req, {
        signal: AbortSignal.timeout(conTimeout),
      });
      return response;
    }
    catch (error)
    {
      cLog('loading FAILED with HTTPS and HTTP for', req.url, error);
      throw error;
    }
  }
}

export async function rFetchUrlText(url, srcReq)
{
  let data = null;

  cLog('LOADING', url);

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

  cLog('LOADING', url);
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
    cLog('HEAD: is rss?', url);
    const tgtReq = new Request(url, {method: 'HEAD'});
    const response = await rFetchUrlCore(tgtReq);
    return (response.ok && response.headers.get('content-type').includes('xml'));
  }
  catch (err)
  {
    console.log(err);
    return false;
  }
}

export async function getMimeType(url)
{
  try
  {
    cLog('HEAD: what mimetype?', url);
    const tgtReq = new Request(url, {method: 'HEAD'});
    const response = await rFetchUrlCore(tgtReq);
    if (response.headers.get('content-type') !== null)
    {
      return response.headers.get('content-type').toString().toLowerCase();
    }
  }
  catch (e)
  {
    return '';
  }
}

export function reworkURL(url)
{
  url = url.replace(/^http:/i, 'https:');
  url = url.replace(/:[\d]{2,4}\//, '/'); //remove port
  url = url.replace(/\/$/, ''); // remove trailing slash

  return url;
}

export function tldFromURL(url)
{
  const p = new URL(url);
  const protocol = (p.protocol != null) ? p.protocol : 'http:';
  const tld = (protocol + '//' + p.host).toLowerCase();

  return tld;
}

export function domainFromURL(url)
{
  const p = new URL(url);
  const domain = p.host.toLowerCase();

  return domain;
}

/********************************************************************
 * We're having this function to remove any styles from the html before
 * creating a DOM. This should speed up JSDOM and prevent error messages
 * regarding CSS parsing. Regex with HTML is an anti pattern, but we clean
 * up the HTML with DOMPurify anyways...
 ********************************************************************/
export function createDom(url, html)
{
  html = html.replace(/<style([\S\s]*?)>([\S\s]*?)<\/style>/gim, '');
  html = html.replace(/<script([\S\s]*?)>([\S\s]*?)<\/script>/gim, '');
  const doc = new JSDOM(html, {url: url});
  return doc.window.document;
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
    console.error(`Got an ERROR trying to read the file: ${error.message}`);
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
    console.error('ERROR determining the public IP:', error);
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
  if (globalThis.prefs.verboseLogging)
  {
    console.log(...args);
  }
}

export function cLogFile(fname, str)
{
  if (globalThis.prefs.verboseLogging)
  {
    fsSync.writeFileSync(fname, str);
  }
}