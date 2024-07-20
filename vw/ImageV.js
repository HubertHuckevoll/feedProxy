import { BaseV }          from './BaseV.js';

/**
 * output images
 * _________________________________________________________________
 */
export class ImageV extends BaseV
{
  constructor(prefs)
  {
    super();
    this.prefs = prefs;
  }

  draw(res, binImageData)
  {
    if (this.prefs.imagesAsJpeg)
    {
      res.writeHead(200, {'Content-Type': 'image/jpeg', 'Content-Length': binImageData.length});
    } else {
      res.writeHead(200, {'Content-Type': 'image/gif', 'Content-Length': binImageData.length});
    }

    res.end(binImageData, 'binary');
  }
}