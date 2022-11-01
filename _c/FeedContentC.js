import { parseFeed } from "https://deno.land/x/rss/mod.ts";

export class FeedContentC
{
  constructor(view)
  {
    this.view = view;
  }

  async get(url)
  {
    const resp = await fetch(url);
    const feed = await parseFeed(await resp.text());
    console.log('Feed read successfully.');

    const response = this.view.drawArticlesForFeed(feed);

    return response;
  }
}