import * as tools from './tools.js';
import imgManip from 'sharp';
import { geo256c } from '../config/geo256c.js';

export async function getImage(url)
{
  let imgBuffer = await tools.rFetchUrl(url);
  imgBuffer = await imgBuffer.arrayBuffer();

  let { data, info } = await imgManip(imgBuffer).raw().toBuffer({ resolveWithObject: true });

  info = {
    width: info.width,
    height: info.height,
    channels: info.channels
  };

  const w = info.width;
  const newWidth = (w < globalThis.prefs.imagesSize) ? w : globalThis.prefs.imagesSize;

  if (globalThis.prefs.imagesAsJpeg)
  {
    return await imgManip(data, {raw: info}).resize(newWidth).jpeg().toBuffer();
  }
  else
  {
    return await imgManip(data, {raw: info}).resize(newWidth).gif().toBuffer()
  }
}

// we don't need this - but it's nice to have the code
function toGeosColors(image)
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