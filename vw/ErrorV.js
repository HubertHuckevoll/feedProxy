import { BaseV }             from '../vw/BaseV.js';

export class ErrorV extends BaseV
{
  draw(res)
  {
    try
    {
      res.statusCode = 403; // Forbidden
      res.end('Forbidden.');
    }
    catch(err)
    {
      console.log(err);
    }
  }
}
