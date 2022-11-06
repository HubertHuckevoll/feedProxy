export class EmptyC
{
  get(res)
  {
    try
    {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end('');

      return true;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}