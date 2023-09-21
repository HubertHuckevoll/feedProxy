export class Html3V
{
  constructor(transcode)
  {
    this.transcode = transcode;

    // FIXME - put these in some sort of settings
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
        erg += '<li><a href="'+feed+'">'+feed+'</a></li>';
      }
    }
    else
    {
      erg += '<li>None.</li>';
    }
    erg += '</ul>';
    erg += this.closePage();

    return this.prepareHTML(erg);
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
    erg += '<h1>'+((articles.title) ? articles.title : 'Feed') +'</h1>';
    erg += '<p>'+((articles.description) ? articles.description : '')+'</p>';
    erg += '<hr>';

    if (articles.entries.length > 0)
    {
      for (const article of articles.entries)
      {
        erg += '<p>';
        erg += '<a href="'+article.link+'">'+article.title+'</a>';
        erg += '</p>';
        erg += '<p>';

        if (article.description)
        {
          text = article.description;
          text = this.transcode.HTML2Text(text);
          erg += text;
        }

        erg += '&nbsp;'+((article.published !== '') ? '<small>('+article.published+')</small>' : '');
        erg += '</p>';
        erg += '<br>';
      }
    }

    erg += '<hr>';
    erg += '<small>'+articles.link+'</small>';
	  erg += this.closePage();

    return this.prepareHTML(erg);
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

    return this.prepareHTML(erg);
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
    erg += '<meta charset="UTF-8">';
    erg += '<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">';
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

  /**
   * Fix up the html for retro browsers
   * ________________________________________________________________
   */
   prepareHTML(html)
  {
    html = html.replace(/https\:\/\//g, 'http://');
    //html = this.transcode.Utf8ToHTML(html);
    //html = this.transcode.Utf8ToIso(html);

    return html;
  }

}