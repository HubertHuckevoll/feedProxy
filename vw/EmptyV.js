import { BaseV }             from '../vw/BaseV.js';

export class EmptyV extends BaseV
{
  draw(res)
  {
    try
    {
      res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': 0});
      res.end();
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
