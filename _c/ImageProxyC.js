export class ImageProxyC
{
  async get(res, url)
  {
    try
    {
      //img = 'http://www.meyerk.com/geos/tools/2gif.php?file='+encodeURIComponent(img)+'&width='+newWidth;
      const newUrl = 'http://hasenbuelt.synology.me/geos/tools/2gif.php?file='+encodeURIComponent(url)+'&width=128';
      const response = await fetch(newUrl);
      let bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));

      res.writeHead(200, {'Content-Type': 'image/gif' });
      res.end(bin, 'binary');

      return true;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}