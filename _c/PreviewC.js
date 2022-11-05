import { setSanitizeHtmlOptions } from 'https://esm.sh/article-parser';
import { extract } from 'https://esm.sh/article-parser';

export class PreviewC
{
  constructor(view)
  {
    this.view = view;
  }

  async get(url)
  {
    const extractHTMLOptions =
    {
      allowedTags: [ 'p', 'span', 'em', 'ul', 'ol', 'li', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7' ]
    }
    setSanitizeHtmlOptions(extractHTMLOptions);

    const res = await fetch(url);
    const html = await res.text();
    const pageObj = await extract(html);

    const response = this.view.drawPreview(pageObj);

    return response;
  }
}