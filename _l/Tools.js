export class Tools
{

  async isRss(url)
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

  async isImage(url)
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

  reworkURL(pAdress, url)
  {
    if (url.startsWith(pAdress))
    {
      url = url.substring(pAdress.length);
    }

    url = url.replace(/:[\d]{2,4}\//, '/');
    url = url.replace(/\/$/, '');

    return url;
  }

  tldFromUrl(url)
  {
    const p = new URL(url);
    const protocol = (p.protocol != null) ? p.protocol : 'https:';
    const tld = protocol + '//' + p.host;

    return tld;
  }

}