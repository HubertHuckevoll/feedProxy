export class PassthroughC
{
  async get(req, res, url)
  {
    try
    {
      let bin = null;
      const response = await fetch(url);
      const conType = response.headers.get("content-type");

      bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));

      res.statusCode = 200;
      res.setHeader('Content-Type', conType);
      res.end(bin);

      return true;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}