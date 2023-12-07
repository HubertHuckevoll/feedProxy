import * as tools from '../lb/Tools.js';
import imgManip from 'sharp';
import { geo256c } from '../config/geo256c.js';

export class ImageProcessor
{

  constructor(prefs)
  {
    this.prefs = prefs;
  }

  async get(url)
  {
    let imgBuffer = await tools.rFetchUrl(url);
    imgBuffer = await imgBuffer.arrayBuffer();

    let { data, info } = await imgManip(imgBuffer).raw().toBuffer({ resolveWithObject: true });

    console.log(info);
    const w = info.width;
    const newWidth = (w < this.prefs.imagesSize) ? w : this.prefs.imagesSize;

    data = this.toGeosColors(data);

    const { width, height, channels } = info;
    return await imgManip(data, {raw: {width, height, channels }}).resize(newWidth).gif().toBuffer();
  }

  /*
  async get(url)
  {
    /*
    let bin = null;
    let imgBuffer = await tools.rFetchUrl(url);
    imgBuffer = await imgBuffer.arrayBuffer();

    const data = await imgManip(imgBuffer).metadata();
    const w = data.width;
    const newWidth = (w < this.prefs.imagesSize) ? w : this.prefs.imagesSize;

    if (this.prefs.imagesAsJpeg) {
      await imgManip(imgBuffer).resize(newWidth).gif().toFile('dummyJ.gif');
      bin = await imgManip(imgBuffer).resize(newWidth).jpeg().toBuffer();
    } else {
      await imgManip(imgBuffer).resize(newWidth).gif().toFile('dummyG.gif');
      bin = await imgManip(imgBuffer).resize(newWidth).gif().toBuffer();
    }

    return bin;
    */

    /*

    let imgBuffer = await tools.rFetchUrl(url);
    imgBuffer = await imgBuffer.arrayBuffer();

    const data = await imgManip(imgBuffer).metadata();
    //const w = data.width;
    //const newWidth = (w < this.prefs.imagesSize) ? w : this.prefs.imagesSize;
    //imgBuffer = await imgManip(imgBuffer).resize(newWidth).toBuffer();

    let info = await imgManip(imgBuffer).metadata();
    info = {
      width: info.width,
      height: info.height,
      channels: info.channels
    };

    const binOrg = await imgManip(imgBuffer).raw().toBuffer();
    const binNew = this.toGeosColors(binOrg);

    // Output
    let retVal = null;
    //if (this.prefs.imagesAsJpeg) {
    //  retVal = await imgManip(binNew).jpeg().toBuffer();
    //} else {
      retVal = await imgManip(binNew, {raw: data}).gif().toBuffer();
    //}
    */

    /*
    imgManip(imgBuffer).raw().toBuffer(async (err, data, info) => {
       data = this.toGeosColors(data);
       console.log(data);
       return await imgManip(data).gif().toBuffer();
    });
  }
  */

  toGeosColors(image)
  {
    const colorPalette = geo256c; // [r, g, b][]

    // Expecting 3 channels (r, g, b without alpha).
    for (let i = 0; i < image.length; i += 3)
    {
      const r = image[i + 0];
      const g = image[i + 1];
      const b = image[i + 2];

      let closestColor = colorPalette[0];
      let minDistance = Number.MAX_SAFE_INTEGER;

      for (const color of colorPalette)
      {
        const distance = Math.sqrt(
          Math.pow(r - color[0], 2) +
          Math.pow(g - color[1], 2) +
          Math.pow(b - color[2], 2));

        if (distance < minDistance)
        {
          minDistance = distance;
          closestColor = color;
        }
      }

      image[i + 0] = closestColor[0];
      image[i + 1] = closestColor[1];
      image[i + 2] = closestColor[2];
    }

    return image;
  }
}