export class Html3V
{
  constructor(prefs, transcode)
  {
    this.prefs = prefs;
    this.transcode = transcode;
  }

  /**
   * Overview
   * ________________________________________________________________
   */
  drawOverloadWarning(url, meta, size)
  {
    let erg = '';
    url = this.setUrlFeedProxyParam(url, 'indexLoad');

    erg += this.openPage();
    erg += '<img src="'+meta.image+'" width="196"><br>';
    erg += '<h1>'+((meta.title != '') ? meta.title : url) +'</h1>';
    erg += '<p>'+((meta.description != '') ? meta.description : 'No description available.')+'</p>';
    erg += '<hr>';
    erg += '<h3>Warning!</h3>';
    erg += '<p>The page you\'re trying to load is pretty big ('+size+' kB) and might crash a retro browser. Click on the link below to open it anyway.</p>';
    erg += '<ul>';
    erg += '<li><a href="'+url+'">'+url+'</a></li>';
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
        let url = this.setUrlFeedProxyParam(article.link, 'articleLoad');

        erg += '<p>';
        erg += '<a href="'+url+'">'+article.title+'</a>';
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

    erg = this.prepareHTML(erg);
    return erg;
  }

  /**
   * Preview
   * _________________________________________________________________
   */
  drawPreview(artObj)
  {
    let erg = '';

    erg += (artObj.title !== '') ? this.openPage() : '';
    erg += (artObj.title !== '') ? '<h1>'+artObj.title+'</h1>' : '';
    erg += (artObj.image !== '') ? '<img src="'+artObj.image+'"><br>' : '';
    erg += (artObj.description !== '') ? '<p>'+artObj.description+'</p>' : '';
    erg += (artObj.title !== '') ? '<hr>' : '';
    erg += (artObj.content !== '') ? artObj.content : '';
    erg += (artObj.title !== '') ? this.closePage() : '';

    return this.prepareHTML(erg);
  }

  /**
   *
   * @param {add value of the feedProxy component to the} url
   * ________________________________________________________________
   */
  setUrlFeedProxyParam(url, val)
  {
    let link = new URL(url);
    let params = link.searchParams;
    params.append('feedProxy', val);
    link = link.toString();

    return link;
  }

  /**
   * open page
   * _____________________________________________________________________
   */
  openPage()
  {
    let erg = '';
    let enc = (this.prefs.encodingUTF8toAsciiAndEntities) ? 'ISO-8859-1' : 'UTF-8';

    erg += '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 3.2//EN">';

    erg += '<html>';
    erg += '<head>';
    erg += '<meta charset="'+enc+'">';
    erg += '<meta http-equiv="Content-Type" content="text/html;charset='+enc+'">';
    erg += '</head>';

    if (this.prefs.outputLightOrDark == 'light')
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
              '<font face="'+this.prefs.outputFontFace+'">';

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
   *
   * https to http
   * ________________________________________________________________
   */
  https2http(html)
  {
    html = html.replace(/https\:\/\//gi, 'http://');
    return html;
  }

  /**
   * Fix up the html for retro browsers
   * ________________________________________________________________
   */
   prepareHTML(html)
  {
    html = this.https2http(html);

    if (this.prefs.encodingUTF8toAsciiAndEntities)
    {
      html = this.transcode.Utf8ToHTML(html);
    }

    return html;
  }

}