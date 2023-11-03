import { BaseV }          from './BaseV.js';

export class FeedV extends BaseV
{
  /**
   * Articles
   * _________________________________________________________________
   */
  draw(articles)
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
          text = this.HTML2Text(text);
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

}