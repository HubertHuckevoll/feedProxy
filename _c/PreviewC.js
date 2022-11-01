import { extract } from 'https://esm.sh/article-parser';

export class PreviewC
{
  constructor(view)
  {
    this.view = view;
  }

  async get(url)
  {
    const res = await fetch(url);
    const html = await res.text();
    const pageObj = await extract(html);

    const response = this.view.drawPreview(pageObj);

    return response;
  }
}