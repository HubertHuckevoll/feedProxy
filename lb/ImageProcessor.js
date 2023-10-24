export class ImageProcessor
{
  constructor(imgManip, prefs, tools)
  {
    this.imgManip = imgManip;
    this.prefs = prefs;
    this.tools = tools;
  }

  async get(url)
  {
    try
    {
      let imgBuffer = await this.tools.rFetch(url);
      imgBuffer = await imgBuffer.arrayBuffer();

      let image = await this.imgManip.read(imgBuffer);

      const size = (this.prefs.imagesSize) ? this.prefs.imagesSize : 196
      image.resize(size, this.imgManip.AUTO);

      if (this.prefs.imagesDither)
      {
        image.dither565();
      }
      const bin = await image.getBufferAsync(this.imgManip.MIME_GIF); // Returns Promise

      return bin;
    }
    catch (err)
    {
      console.log(err);
    }
  }

}

