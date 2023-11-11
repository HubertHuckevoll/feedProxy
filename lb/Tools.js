import fetch                from 'node-fetch';
import fs                   from 'fs/promises';
import os                   from 'os';
import chardet              from 'chardet';

// retro fetch
export async function rFetch(url, headers = null)
{
  let response = null;
  try
  {
    cLog('loading', url);
    response = (headers !== null) ? await fetch(url, headers) : await fetch(url);
    return response;
  }
  catch (error)
  {
    // fallback from https to http
    url = url.replace(/^https:/i, 'http:');
    cLog('failed, falling back to HTTP', url);
    try
    {
      response = (headers !== null) ? await fetch(url, headers) : await fetch(url);
      return response;
    }
    catch (error)
    {
      cLog('loading failed with HTTPS and HTTP for', url, error)
      throw error;
    }
  }
}

export async function rFetchText(url)
{
  let data = null;

  const response = await rFetch(url);
  data = await response.arrayBuffer();
  data = Buffer.from(new Uint8Array(data));

  const encoding = chardet.detect(data);
  const decoder = new TextDecoder(encoding);
  data = decoder.decode(data);

  return data;
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