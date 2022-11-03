import { HtmlV } from './HtmlV.js';

export class Html3V extends HtmlV
{
  constructor()
  {
    // FIXME - put these in some sort of settings

    super();
    this.uim = 'l'; //d for dark mode
    this.fontFace = 'Arial'; //FIXME, doesn't work for now,why?
  }

  /**
   * Overview
   * ________________________________________________________________
   */
  drawOverview(url, meta, feeds)
  {
    let erg = '';

    erg += this.openPage();
    erg += '<img src="'+meta.image+'"><br>';
    erg += '<h1>'+((meta.title != '') ? this.Utf8ToHTML(meta.title) : url) +'</h1>';
    erg += '<p>'+((meta.description != '') ? this.Utf8ToHTML(meta.description) : 'No description available.')+'</p>';
    erg += '<h3>Available Feeds</h3>';
    erg += '<ul>';
    if (feeds.length > 0)
    {
      for (const feed of feeds)
      {
        const feedHttp = feed;
        erg += '<li><a href="'+feedHttp+'">'+feedHttp+'</a></li>';
      }
    }
    else
    {
      erg += '<li>None.</li>';
    }
    erg += '</ul>';
    erg += this.closePage();

    return this.makeResponse(erg);
  }

  /**
   * Articles
   * _________________________________________________________________
   */
  drawArticlesForFeed(articles)
  {
    let erg = '';

    erg += this.openPage();
    erg += '<img src="'+((articles.image) ? articles.image.url : '')+'"><br>';
    erg += '<h1>'+((articles.title.value != '') ? this.Utf8ToHTML(articles.title.value) : articles.id) +'</h1>';
    erg += '<p>'+((articles.description != '') ? this.Utf8ToHTML(articles.description) : '')+'</p>';
    erg += '<hr>';

    if (articles.entries.length > 0)
    {
      for (const article of articles.entries)
      {
        erg += '<p>';
        erg += '<a href="'+article.links[0].href+'">'+this.Utf8ToHTML(article.title.value)+'</a>';
        erg += '</p>';
        erg += '<p>';
        erg += this.Utf8ToHTML(this.stripTags(article.description.value));
        erg += '&nbsp;<small>('+ article.published+')</small>';
        erg += '</p>';
        erg += '<br>';
      }
    }

    erg += '<hr>';
    erg += '<small>'+articles.links[0]+'</small>';
	  erg += this.closePage();

    return this.makeResponse(erg);
  }

  /**
   * Preview
   * _________________________________________________________________
   */
  drawPreview(artObj)
  {
    let erg = '';
    let text = artObj.content;
    text = this.Utf8ToHTML(text);

    erg += this.openPage();
    erg += '<h1>'+this.Utf8ToHTML(artObj.title)+'</h1>';
    erg += '<img src="'+artObj.image+'"><br>';
    erg += text;
    erg += this.closePage();

    return this.makeResponse(erg);
  }

  /**
   * open page
   * _____________________________________________________________________
   */
  openPage()
  {
    let erg = '';
    erg += '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 3.2//EN">';

    erg += '<html>';
    erg += '<head>';
    erg += '<meta http-equiv="Content-Type" content="text/html;charset=iso-8859-1">';
    erg += '</head>';

    if (this.uim == 'l')
    { // light mode
      erg += '<body text="#000000" bgcolor="#FFFFFF" link="#0000FF" vlink="#0000FF">';
    }
    else
    { // dark mode
      erg += '<body text="#FFFFFF" bgcolor="#000000" link="#006699" vlink="#006699">';
    }

    erg += '<table border="0" width="100%" cellpadding="0">'+
            '<tr>'+
              '<td></td>'+
              '<td width="600">'+
              '<font face="'+this.fontFace+'">';

    return erg;
  }

  /**
   * close the page
   * ________________________________________________________________
   */
  closePage()
  {
    let erg = '';
    erg += '</font>';
    erg += '</td>';
    erg += '<td></td>';
    erg += '</tr>';
    erg += '</table';
    erg += '</body>';
    erg += '</html>';

    return erg;
  }
}