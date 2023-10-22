export class ImageProcessor
{
  constructor(jimp, prefs, tools)
  {
    this.jimp = jimp;
    this.prefs = prefs;
    this.tools = tools;
  }

  async get(url)
  {
    try
    {
      console.log('processing as image', url);

      let imgBuffer = await this.tools.rFetch(url);
      imgBuffer = await imgBuffer.arrayBuffer();
      let image = await this.jimp.read(imgBuffer);

      const size = (this.prefs.imagesSize) ? this.prefs.imagesSize : 196
      image.resize(size, this.jimp.AUTO);

      if (this.prefs.imagesDither)
      {
        image.dither565();
      }
      const bin = await image.getBufferAsync(this.jimp.MIME_GIF); // Returns Promise

      return bin;
    }
    catch (err)
    {
      console.log(err);
    }
  }

}

