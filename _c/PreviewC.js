import { setSanitizeHtmlOptions } from 'article-parser';
import { extract } from 'article-parser';

export class PreviewC
{
  constructor(view)
  {
    this.view = view;
  }

  async get(res, url)
  {
    try
    {
      const extractHTMLOptions =
      {
        allowedTags: [ 'p', 'span', 'em', 'ul', 'ol', 'li', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7' ]
      }
      setSanitizeHtmlOptions(extractHTMLOptions);

      const resp = await fetch(url);
      const text = await resp.text();
      const pageObj = await extract(text);
      const html = this.view.drawPreview(pageObj);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);

      return true;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}