export class ImageProcessor
{
  constructor(imgManip, prefs, tools)
  {
    this.imgManip = imgManip;
    this.prefs = prefs;
    this.tools = tools;
  }

  async get(url, newWidth = null)
  {
    try
    {
      let imgBuffer = await this.tools.rFetch(url);
      imgBuffer = await imgBuffer.arrayBuffer();

      let image = await this.imgManip.read(imgBuffer);
      let w = image.bitmap.width; //  width of the image

      if (newWidth == null)
      {
        newWidth = (w < this.prefs.imagesSize) ? w : this.prefs.imagesSize;
      }
      image.resize(newWidth, this.imgManip.AUTO);

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

