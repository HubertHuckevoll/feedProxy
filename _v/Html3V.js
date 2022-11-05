import { HtmlV } from './HtmlV.js';

export class Html3V extends HtmlV
{
  constructor()
  {
    // FIXME - put these in some sort of settings

    super();
    this.uim = 'l'; //d for dark mode
    this.fontFace = 'Arial';
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
    erg += '<h1>'+((meta.title != '') ? meta.title : url) +'</h1>';
    erg += '<p>'+((meta.description != '') ? meta.description : 'No description available.')+'</p>';
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

    return this.encodeResponse(erg);
  }

  /**
   * Articles
   * _________________________________________________________________
   */
  drawArticlesForFeed(articles)
  {
    let erg = '';
    let text = '';

    erg += this.openPage();
    erg += '<img src="'+((articles.image) ? articles.image.url : '')+'"><br>';
    erg += '<h1>'+((articles.title) ? articles.title.value : articles.id) +'</h1>';
    erg += '<p>'+((articles.description) ? articles.description : '')+'</p>';
    erg += '<hr>';

    if (articles.entries.length > 0)
    {
      for (const article of articles.entries)
      {
        if (article.description)
        {
          text = (article.description) ? article.description.value : '';
          if (text == '')
          {
            text = (article.content) ? article.content.value : '';
          }
          text = this.HTML2Text(text);

          erg += '<p>';
          erg += '<a href="'+article.links[0].href+'">'+article.title.value+'</a>';
          erg += '</p>';
          erg += '<p>';
          erg += text;
          erg += '&nbsp;<small>('+ article.published+')</small>';
          erg += '</p>';
          erg += '<br>';
        }
      }
    }

    erg += '<hr>';
    erg += '<small>'+articles.links[0]+'</small>';
	  erg += this.closePage();

    return this.encodeResponse(erg);
  }

  /**
   * Preview
   * _________________________________________________________________
   */
  drawPreview(artObj)
  {
    let erg = '';
    const text = artObj.content;

    erg += this.openPage();
    erg += '<h1>'+artObj.title+'</h1>';
    erg += '<img src="'+((artObj.image) ? artObj.image : '')+'"><br>';
    erg += '<p>'+((artObj !== null) ? artObj.description : '')+'</p>';
    erg += '<hr>';
    erg += text;
    erg += this.closePage();

    return this.encodeResponse(erg);
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
    erg += '<meta charset="utf-8">';
    erg += '<meta http-equiv="Content-Type" content="text/html;charset=utf-8">'; // Deno ALWAYS returns UTF-8... :-(
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