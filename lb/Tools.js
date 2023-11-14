//import fetch                from 'node-fetch';
import fs                   from 'fs/promises';
import os                   from 'os';
import chardet              from 'chardet';

import fetch                from 'node-fetch';
import { Request }          from 'node-fetch';

import qs                   from 'querystring';


// retro fetch with Request object, our core function
export async function rFetchCore(req)
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
    req.url.replace(/^https:/i, 'http:');
    cLog('failed, falling back to HTTP', req.url);
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

async function sendRequest(url, data) {

  const pl = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: data
  };

  console.log(pl);

  const response = await fetch(url, pl);

  return response;
}

export async function rFetchReq(srcReq, headers = null)
{
  const url = reworkURL(srcReq.url);

  let result = null;

  if (srcReq.method === 'POST')
  {
    result = await new Promise((resolve, reject) =>
    {
      let body = [];
      srcReq.on('data', chunk =>
      {
        body.push(chunk);
      }).on('end', async () =>
      {
        body = Buffer.concat(body).toString();
        const result = await sendRequest(url, body);
        resolve(result);
      });
    });
  }

  //const tgtReq = new Request(url, srcReq, { headers: headers });
  //console.log(tgtReq);

  return result;
}

export async function rFetchText(srcReq)
{
  let data = null;

  const response = await rFetchReq(srcReq);
  data = await response.arrayBuffer();
  data = Buffer.from(new Uint8Array(data));

  const encoding = chardet.detect(data);
  const decoder = new TextDecoder(encoding);
  data = decoder.decode(data);

  return data;
}

export async function rFetch(url, headers = null)
{
  const tgtReq = new Request(url, { headers: headers });
  tgtReq.url.replace(/^http:/i, 'https:');

  return await rFetchCore(tgtReq);
}

export async function isRss(url)
{
  try
  {
    const response = await rFetch(url, {method: 'HEAD'});
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
    const response = await rFetch(url, {method: 'HEAD'});
    return response.headers.get('content-type').toString().toLowerCase();
  }
  catch (err)
  {
    console.log(err);
    return 'text/html';
  }
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