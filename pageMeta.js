import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

export class pageMeta
{
  constructor(url)
  {
    this.url = url;
  }

  async get()
  {
    try
    {
      const response = await fetch(this.url);
      const text = await response.text();

      // FIXME on zeit.de/index
      const doc = new DOMParser().parseFromString(text, "text/html");

      const titleNode = doc.querySelector('meta[property="og:title"]');
      const descNode = doc.querySelector('meta[property="og:description"]');
      const imageNode = doc.querySelector('meta[property="og:image"]');

      const title = (titleNode !== null) ? titleNode.getAttribute('content') : '';
      const desc = (descNode !== null) ? descNode.getAttribute('content') : '';
      const image = (imageNode !== null) ? imageNode.getAttribute('content') : '';

      const ret =
      {
        title: title,
        description: desc,
        image: image
      };

      return ret;
    }
    catch(err)
    {
      throw(err);
    }
  }

}

