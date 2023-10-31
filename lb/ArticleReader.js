import * as tools             from './Tools.js';
//import * as articleExtractor  from '@extractus/article-extractor';
import { Readability as articleExtractor } from '@mozilla/readability';
import { JSDOM as dom }       from 'jsdom';

export class ArticleReader
{
  async get(url)
  {
    try
    {
      /*
        // when using '@extractus/article-extractor';
        const extractHTMLOptions =
        {
          allowedTags: [ 'p', 'span', 'table',
                        'ul', 'ol', 'li',
                        'strong', 'em',
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7' ]
        }

        articleExtractor.setSanitizeHtmlOptions(extractHTMLOptions);
        ...
        let pageObj = await articleExtractor.extractFromHtml(text);
      */

      const resp = await tools.rFetch(url);
      const text = await resp.text();

      const doc = new dom(text, {url: url});
      let reader = new articleExtractor(doc.window.document);
      let pageObj = reader.parse();

      if (pageObj == null)
      {
        pageObj = {
          'content': text,
          'title': '',
          'image': '',
          'published': '',
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