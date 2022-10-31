export class Tools
{

  async isRss(url)
  {
    try
    {
      const response = await fetch(url);
      if (response.ok && response.headers.get('content-type').includes('xml'))
      {
        return true;
      }
      return false;
    }
    catch (err)
    {
      throw(err);
    }
  }

  tldFromUrl(url)
  {
    const p = new URL(url);
    const protocol = (p.protocol != null) ? p.protocol : 'https:';
    const tld = protocol + '//' + p.host + ':80/';

    return tld;
  }

}