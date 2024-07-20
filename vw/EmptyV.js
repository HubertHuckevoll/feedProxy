import { BaseV }             from '../vw/BaseV.js';

export class EmptyV extends BaseV
{
  draw(res)
  {
    try
    {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('');
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
