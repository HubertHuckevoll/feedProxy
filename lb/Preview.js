import * as tools             from '../lb/Tools.js';
import * as articleExtractor  from '@extractus/article-extractor';

export class Preview
{
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

      articleExtractor.setSanitizeHtmlOptions(extractHTMLOptions);

      const resp = await tools.rFetch(url);
      const text = await resp.text();
      let pageObj = await articleExtractor.extractFromHtml(text);

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