import { serve } from "https://deno.land/std@0.161.0/http/server.ts";
import { OverviewC } from './_c/OverviewC.js';
import { FeedContentC } from './_c/FeedContentC.js';
import { PreviewC } from './_c/PreviewC.js';
import { Tools } from './_l/Tools.js';
import { Html3V } from './_v/Html3V.js';


const port = 8080;
const pAdress = 'http://localhost:'+port+'/';

const handler = async (request: Request): Promise<Response> =>
{
  let response = null;
  let url = request.url;
  let tld = '';
  const referer = request.headers.get('referer');
  let nonProxyMode = false; // FIXME: pass to view to create a non-proxy mode later

  const tools = new Tools();
  const view = new Html3V();

  console.log('Originally requested URL: ', url);

  if (url.startsWith(pAdress))
  {
    nonProxyMode = true;
    console.log('Non-Proxy Mode detected.');
  }

  url = tools.reworkURL(pAdress, url);
  tld = new Tools().tldFromUrl(url);
  console.log('Reworked URL: ', url);
  console.log('TLD: ', tld);

  if (!url.includes('favicon.ico'))
  {
    if (await new Tools().isRss(url))
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
          if (await tools.isRss(referer))
          {
            response = await new PreviewC(view).get(url);
          }
          else
          {
            response = view.drawEmpty();
          }
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