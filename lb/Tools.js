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
    const url = req.url.replace(/^https:/i, 'http:');
    req = new Request(url);
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

export async function rFetchText(srcReq)
{
  let data = null;

  const newReq = await cloneRequest(srcReq);
  const response = await rFetchCore(newReq);
  data = await response.arrayBuffer();
  data = Buffer.from(new Uint8Array(data));

  const encoding = chardet.detect(data);
  const decoder = new TextDecoder(encoding);
  data = decoder.decode(data);

  return data;
}

export async function rFetch(url, headers = null)
{
  url = reworkURL(url);
  const tgtReq = new Request(url, { headers: headers });

  return await rFetchCore(tgtReq);
}

/**
 * FIXME:
 * - if rFetch fails, it falls back to http by URL only
 * and the post data is lost again - use cloneRequest instead
 * - sanitize the APIs of the different fetch versions
 */
export async function cloneRequest(srcReq)
{
  let result = null;
  const url = reworkURL(srcReq.url);

  if ((srcReq.method === 'POST') &&
      (srcReq.headers['content-type'] == 'application/x-www-form-urlencoded'))
  {
    result = await new Promise((resolve, reject) =>
    {
      let body = [];

      srcReq.on('data', chunk =>
      {
        body.push(chunk);
      });

      srcReq.on('end', async () =>
      {
        body = Buffer.concat(body).toString();

        const newReq = new Request(url, {
          method: 'POST',
          headers: {
            'Content-Type': srcReq.headers['content-type']
          },
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