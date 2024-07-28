import { BaseV }             from '../vw/BaseV.js';

/*
  let gifBuffer = Buffer.alloc(50); // Adjust size based on actual GIF content

  // GIF header
  gifBuffer.writeUInt32LE(0x47, 0); // "GIF"
  gifBuffer.writeUInt16LE(0x38, 6); // Version 87a
  gifBuffer.writeUInt16LE(0x39, 8); // Logical screen size - width 640, height 480
  gifBuffer.writeUInt16LE(0x01, 10); // Global Color Table Flag
  gifBuffer.writeUInt16LE(0x00, 12); // Background color index
  gifBuffer.writeUInt16LE(0x00, 14); // No palette
  gifBuffer.writeUInt16LE(0x03, 16); // Header length
  gifBuffer.writeUInt32LE(0x02c90000, 18); // Image descriptor - left, top, right, bottom, flags, etc.

  // Image data (1x1 white pixel)
  // Assuming a simple representation for demonstration purposes
  gifBuffer.writeUInt8(0xFF, 22); // Pixel data (white)

  // Trailer
  gifBuffer.writeUInt8(0x3B, 23); // End of GIF file marker

  // Set the Content-Type header
  res.setHeader('Content-Type', 'image/gif');

  // Send the GIF buffer as a response
  res.end(gifBuffer);
*/

export class ErrorV extends BaseV
{
  draw(res, msg)
  {
    try
    {
      msg = this.openPage() + this.prepareHTML(msg) + this.closePage();
      res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length' : msg.length});
      res.end(msg);
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
