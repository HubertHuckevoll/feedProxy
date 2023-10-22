export class Preview
{
  constructor(articleParser, tools)
  {
    this.parser = articleParser;
    this.tools = tools;
  }

  async get(url)
  {
    try
    {
      const extractHTMLOptions =
      {
        allowedTags: [ 'p', 'span', 'em', 'ul', 'ol', 'li', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7' ]
      }

      this.parser.setSanitizeHtmlOptions(extractHTMLOptions);

      const resp = await this.tools.rFetch(url);
      const text = await resp.text();
      const pageObj = await this.parser.extract(text);

      return pageObj;
    }
    catch (err)
    {
      console.log(err);
    }
  }
}

