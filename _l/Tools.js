import fetch                from 'node-fetch';

export async function isRss(url)
{
  try
  {
    const response = await fetch(url, {method: 'HEAD'});
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
    const response = await fetch(url, {method: 'HEAD'});
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

  url = url.replace(/:[\d]{2,4}\//, '/');
  url = url.replace(/\/$/, '');
  url = url.toLowerCase();

  return url;
}

export function tldFromUrl(url)
{
  const p = new URL(url);
  const protocol = (p.protocol != null) ? p.protocol : 'http:';
  const tld = (protocol + '//' + p.host).toLowerCase();

  return tld;
}