import { BaseV }             from '../vw/BaseV.js';

export class PassthruV extends BaseV
{
  async draw(res, fetchResponse)
  {
    try
    {
      // fetchResponse.headers.forEach((value, name) => {
      //   res.setHeader(name, value);
      // });
      // fetchResponse.body.pipe(res);

      const buffer = await fetchResponse.arrayBuffer();
      const totalSize = buffer.byteLength;

      // Kopiere andere relevante Header, außer Content-Length
      fetchResponse.headers.forEach((value, name) =>
      {
      //if (name.toLowerCase() !== 'content-length') {
        res.setHeader(name, value);
      //}
      });

      //res.setHeader('Content-Length', totalSize);
      //res.setHeader('content-length', totalSize);

      // Setze den Statuscode der Antwort
      res.writeHead(fetchResponse.status);

      // Sende die Daten an den Client
      res.end(Buffer.from(buffer));
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
