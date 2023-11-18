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

    /*
    let imgBuffer = await tools.rFetchUrl(url);
    imgBuffer = await imgBuffer.arrayBuffer();
    let image = imgManip(imgBuffer);
    let info = await image.metadata();
    info = {
      width: info.width,
      height: info.height,
      channels: info.channels
    };

    console.log('INFO', info);

    let binData = await image.raw().toBuffer();
    binData = this.toGeosColors(binData);

    // Output
    //const bin = (this.prefs.imagesAsJpeg) ? await image.jpeg().toBuffer() : await image.gif().toBuffer();
           //await imgManip(binData, {raw: info}).gif({options: {reuse: false}}).toFile('dummy1.gif');
    return await imgManip(binData, {raw: info}).gif({options: {reuse: false}}).toBuffer();
    //return await imgManip(binData, {raw: info}).gif().toBuffer();
    */
  }

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