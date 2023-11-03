import * as tools from '../lb/Tools.js';
import imgManip from 'sharp';
import svg2img  from 'svg2img';

export class ImageProcessor
{
  constructor(prefs)
  {
    this.prefs = prefs;
  }

  async get(mimeType, url)
  {
    try
    {
      let bin = null;
      let imgBuffer = await tools.rFetch(url);

      if (mimeType != 'image/gif')
      {
        if (mimeType == 'image/svg+xml')
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

        const data = await imgManip(imgBuffer).metadata();
        const w = data.width;
        const newWidth = (w < this.prefs.imagesSize) ? w : this.prefs.imagesSize;
        bin = await imgManip(imgBuffer).resize(newWidth).gif().toBuffer();
      }
      else
      {
        const buffer = await imgBuffer.arrayBuffer();
        bin = new Uint8Array(buffer);
      }

      return bin;
    }
    catch (err)
    {
      console.log(err);
    }
  }

}