import { serve } from "https://deno.land/std@0.161.0/http/server.ts";
import { Tools } from './Tools.js';
import { OverviewC } from './OverviewC.js';
import { FeedContentC } from './FeedContentC.js';
import { PreviewC } from './PreviewC.js';
import { html3V } from './html3V.js';


const port = 8080;
const pAdress = 'http://localhost:'+port+'/';

const handler = async (request: Request): Promise<Response> =>
{
  let response = null;
  let url = request.url;
  const view = new html3V();

  console.log('Originally requested URL: ', url);

  if (request.url.startsWith(pAdress))
  {
    url = request.url.substring(pAdress.length);
    console.log('Non-proxy mode detected, reworking URL to be: ', url);
  }

  if (!url.includes('favicon.ico'))
  {
    const tld = new Tools().tldFromUrl(url);
    const isRss = await new Tools().isRss(url);

    if (isRss)
    {
      response = await new FeedContentC(view).get(url);
    }
    else
    {
      if (
          (url.includes('meyerk.com')) ||
          (url.includes('hasenbuelt'))
         )
      {
        const newReq = new Request(url, request);
        response = fetch(newReq);
      }
      else
      {
        if (url == tld)
        {
          response = await new OverviewC(view).get(url);
        }
        else
        {
          response = await new PreviewC(view).get(url);
        }
      }
    }
  }

  if (response == null)
  {
    response = view.drawError('The content of this webpage can\'t be displayed.');
  }

  return response;
};

console.log('*feedProxy* running.');
console.log('----------------------------------------------------------------------');
await serve(handler, { port });