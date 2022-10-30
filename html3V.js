import { Tools } from './Tools.js';


export class html3V
{
  constructor()
  {
    // FIXME
    this.uim = 'l'; //d for dark mode
    this.fontFace = 'Arial';
  }
  /**
   * Articles
   * _________________________________________________________________
   */
  drawArticlesForFeed(articles)
  {
    let erg = '';
    erg = this.openPage();
    const tools = new Tools();

    /*
    if (this.stateParams['iU'] >= IMAGE_USE_MEDIUM)
    {
      if (this.hasLogo($feed))
      {
        erg += '<p><img src="'.this.imageProxy($feed['meta']['logo'], 64).'" alt="'.$feed['meta']['logo'].'"></p>';
      }
    }
    */

    if (articles.entries.length > 0)
    {
      for (const article of articles.entries)
      {
        erg += '<p>';
        erg += tools.Utf8ToHTML(article.title.value);
        erg += '</p>';

        /*
        if (this.stateParams['iU'] >= IMAGE_USE_ALL)
        {
          if (isset(article['image']) && (article['image'] != ''))
          {
            erg += '<p><img src="'.this.imageProxy(article['image'], 128).'"></p>';
          }
        }
        */

        erg += '<p>';
        erg += tools.Utf8ToHTML(tools.stripTags(article.description.value));
        erg += '&nbsp;('+ article.published+')';
        erg += '</p>';
      }
    }

    erg += '<hr>';
    erg += '<small>'+articles.links[0]+'</small>';

	  erg += this.closePage();

    return erg;
  }

  /**
   * Preview
   * _________________________________________________________________
   */
  drawPreviewArticle()
  {
    /*
    article = this.getData('article');
    $headline = this.getData('headline');
    articleFullLink = this.getData('articleFullLink');
    erg = '';

    erg += this.openPage();
    erg += '<hr>';
    erg += this.renderBreadCrumbs('previewArticle');
    erg += '<hr>';

    erg += '<h3>'.$headline.'</h3>';

    if (this.stateParams['iU'] >= IMAGE_USE_SOME)
    {
      erg += '<center><img src="'.this.imageProxy(article['meta']['image'], 400).'"></center>';
    }

    foreach (article['text'] as $node)
    {
      $tag = $node['tag'];
      $str = $node['content'];

      if (preg_match('/h[2-5]/', $tag))
      {
        $tag = 'h4';
      }

      erg += '<'.$tag.'>';
      erg += $str;
      erg += '</'.$tag.'>';
    }

    erg += '<hr>';
    // this has to be a link with a wordwrapped text to make sure
    // Skipper doesn't grow the table cell because the text is
    // too long...
    erg += '<small><a href="'.articleFullLink.'" target="_blank">'.wordwrap(articleFullLink, 75, "\r", true).'</a></small>';
	  erg += this.closePage();

    this.send(erg);
    */
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
              '<td width="600">';

    return erg;
  }

  /**
   * close the page
   * ________________________________________________________________
   */
  closePage()
  {
    let erg = '';
    erg += '</td>'+
            '<td></td>'+
            '</tr>'+
            '</table';

    erg += '</body>';
    erg += '</html>';

    return erg;
  }
}