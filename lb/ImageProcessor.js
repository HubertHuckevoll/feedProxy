import * as tools from '../lb/Tools.js';
import imgManip from 'jimp';
import svg2img  from 'svg2img';

export class ImageProcessor
{
  constructor(prefs)
  {
    this.prefs = prefs;
  }

  async get(url, newWidth = null)
  {
    try
    {
      let imgBuffer = await tools.rFetch(url);

      if (url.includes('svg'))
      {
        imgBuffer = await imgBuffer.text();
        imgBuffer = await new Promise(function (resolve, reject)
        {
          svg2img(imgBuffer, function(error, buffer)
          {
            if (error) reject();
            resolve(buffer);
          });
        })
      }
      else
      {
        imgBuffer = await imgBuffer.arrayBuffer();
      }

      let image = await imgManip.read(imgBuffer);
      let w = image.bitmap.width; //  width of the image

      if (newWidth == null)
      {
        newWidth = (w < this.prefs.imagesSize) ? w : this.prefs.imagesSize;
      }
      image.resize(newWidth, imgManip.AUTO);

      if (this.prefs.imagesDither)
      {
        image.dither565();
      }
      const bin = await image.getBufferAsync(imgManip.MIME_GIF); // Returns Promise

      return bin;
    }
    catch (err)
    {
      console.log(err);
    }
  }

}