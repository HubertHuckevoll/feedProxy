export class PassthroughC
{
  get(url, origReq)
  {
    try
    {
      const newReq = new Request(url, origReq);
      const response = fetch(newReq);

      return response;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}