// FIXME - take dependencies inside of the modules, DI is driving me nuts
import { setSanitizeHtmlOptions } from '@extractus/article-extractor'
export class Preview
{
  constructor(extractFromHtml, tools)
  {
    this.parser = extractFromHtml;
    this.tools = tools;
  }

  async get(url)
  {
    try
    {
      const extractHTMLOptions =
      {
        allowedTags: [ 'p', 'span', 'em',
                       'ul', 'ol', 'li',
                       'strong',
                       'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7' ]
      }

      setSanitizeHtmlOptions(extractHTMLOptions);

      const resp = await this.tools.rFetch(url);
      const text = await resp.text();
      let pageObj = await this.parser(text);

      if (pageObj == null)
      {
        pageObj = {
          'content': text,
          'title': '',
          'image': '',
          'description': ''
        }
      }

      return pageObj;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}

