import { BaseV }          from './BaseV.js';

export class FeedV extends BaseV
{
  /**
   * Articles
   * _________________________________________________________________
   */
  draw(res, userUrl, articles)
  {
    let erg = '';
    let text = '';

    erg += this.openPage();

    userUrl = this.setUrlFeedProxyParam(userUrl, 'lP');
    erg += '<small><a href="'+userUrl+'">Load Stripped Page View</a></small>';
    erg += '<hr>';
    erg += '<h1>'+((articles.title) ? articles.title : 'Feed') +'</h1>';
    erg += '<p>'+((articles.description) ? articles.description : '')+'</p>';
    erg += '<hr>';

    if (articles.entries.length > 0)
    {
      for (let i=0; i < articles.entries.length; i++)
      {
        const article = articles.entries[i];
        const url = this.setUrlFeedProxyParam(article.link, 'lA');

        erg += '<p>';
        erg += '<a href="'+url+'">'+article.title+'</a>';
        erg += '</p>';
        erg += '<p>';

        if (article.description)
        {
          text = article.description;
          text = this.HTML2Text(text);
          erg += text;
        }

        erg += '&nbsp;'+((article.published !== '') ? '<small>('+article.published+')</small>' : '');
        erg += '</p>';
        erg += '<br>';

        if (i >= (globalThis.prefs.feedListLength-1)) break;
      }
    }

    erg += '<hr>';
    erg += '<small>'+articles.link+'</small>';

    erg += this.closePage();

    erg = this.prepareHTML(erg);

    res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length' : erg.length});
    res.end(erg);
  }

}