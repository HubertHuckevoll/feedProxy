import { serve } from "https://deno.land/std@0.161.0/http/server.ts";
import { parseFeed } from "https://deno.land/x/rss/mod.ts";
import { extract } from 'https://esm.sh/article-parser'
import { feedRat } from './feedRat.js';
import { html3V } from './html3V.js';


const port = 8080;

const handler = async (request: Request): Promise<Response> =>
{
  console.log(request.url);

  let newResponse = null;

  if (!request.url.includes('favicon.ico'))
  {
    const fr = new feedRat();
    const feeds = await fr.run(request.url);
    console.log('Found feeds: ', feeds);

    if (feeds.length > 0)
    {
      const resp = await fetch(feeds[0]);
      console.log('Selecting feed: ', feeds[0]);

      const feed = await parseFeed(await resp.text());
      console.log('Feed read.');

      const view = new html3V();
      const rawHTML = view.drawArticlesForFeed(feed);
      const encHTML = new TextEncoder().encode(rawHTML);

      newResponse = new Response(encHTML, { status: 200 });
    }
  }

  if (newResponse == null)
  {
    newResponse = await fetch(request);
  }

  return newResponse;

  //const body = 'Okay.';
  //return new Response(body, { status: 200 });

  //const resp = fetch(request.url);
  //return resp;

  /*
  let newRequest = null;
  if (request.url.includes('bw_big.gif'))
  {
    newRequest = new Request('https://media.tenor.com/fv-nkS0ahugAAAAM/nyancat-donuts.gif', request);
  }
  else
  {
    newRequest = request.clone();
  }
  const resp = await fetch(newRequest);
  */

  //console.log(resp);

};

console.log(`HTTP webserver running. Access it at: http://localhost:${port}/`);
await serve(handler, { port });