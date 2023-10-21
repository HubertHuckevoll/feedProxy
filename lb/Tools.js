import fetch                from 'node-fetch';
import fs                   from 'fs/promises';
import os                   from 'os';


// retro fetch
export async function rFetch(url, headers = null)
{
  let response = null;
  try
  {
    response = (headers !== null) ? await fetch(url, headers) : await fetch(url);
    return response;
  }
  catch (error)
  {
    url = url.replace('https://', 'http://'); // lets try oldschool html second
    try
    {
      response = (headers !== null) ? await fetch(url, headers) : await fetch(url);
      return response;
    }
    catch (error)
    {
      throw error;
    }
  }
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
  }
}

export async function isImage(url)
{
  try
  {
    const response = await rFetch(url, {method: 'HEAD'});
    return (response.ok && response.headers.get('content-type').includes('image'));
  }
  catch (err)
  {
    console.log(err);
  }
}

export function reworkURL(pAdress, url)
{
  if (url.startsWith(pAdress))
  {
    url = url.substring(pAdress.length);
  }

  url = url.toLowerCase();
  url = url.replace('http://','https://'); // lets always try https first
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
