export class Passthrough
{
  constructor(tools)
  {
    this.tools = tools;
  }

  async get(url)
  {
    try
    {
      let bin = null;
      const response = await this.tools.rFetch(url);
      const conType = response.headers.get("content-type");

      bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));

      const ret = {'conType': conType, 'bin': bin}
      return ret;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}

