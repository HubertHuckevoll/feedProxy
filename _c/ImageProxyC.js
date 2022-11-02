export class ImageProxyC
{
  get(url, origReq)
  {
    try
    {
      //img = 'http://www.meyerk.com/geos/tools/2gif.php?file='+encodeURIComponent(img)+'&width='+newWidth;
      const newUrl = 'https://hasenbuelt.synology.me/geos/tools/2gif.php?file='+encodeURIComponent(url)+'&width=128';
      const newReq = new Request(newUrl, origReq);
      const response = fetch(newReq);

      return response;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}