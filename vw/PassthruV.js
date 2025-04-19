import { BaseV } from '../vw/BaseV.js';

export class PassthruV extends BaseV
{
  async draw(res, fetchResponse)
  {
    try
    {
      // Copy relevant headers (excluding problematic ones like content-encoding if node handles it)
      fetchResponse.headers.forEach((value, name) => {
        // Avoid setting content-length if node will handle chunked encoding
        // Avoid content-encoding as node might handle decompression
        if (!['content-length', 'content-encoding', 'transfer-encoding'].includes(name.toLowerCase())) {
           res.setHeader(name, value);
        }
      });

      // Set status code
      res.writeHead(fetchResponse.status);

      // Pipe the body directly for memory efficiency
      // Note: No res.end() needed when piping
      fetchResponse.body.pipe(res);
    }
    catch(err)
    {
      console.error('Error in PassthruV:', err);
      // Ensure response ends if piping fails mid-way (might be tricky)
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.end('Proxy error');
      }
    }
  }
}
