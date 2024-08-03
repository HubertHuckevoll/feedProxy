import { BaseV }          from '../vw/BaseV.js';

export class OverloadWarningV extends BaseV
{
  /**
   * Overview
   * ________________________________________________________________
   */
  draw(res, pl)
  {
    let erg = '';
    let url = this.setUrlFeedProxyParam(pl.url, 'lP');

    erg += this.openPage();
    erg += '<img src="'+pl.meta.image+'" width="196"><br>';
    erg += '<h1>'+((pl.meta.title != '') ? pl.meta.title : url) +'</h1>';
    erg += '<p>'+((pl.meta.description != '') ? pl.meta.description : 'No description available.')+'</p>';
    erg += '<hr>';
    erg += '<h3>Whoa!</h3>';
    erg += '<p>The page you\'re trying to load is pretty big (at least <strong>'+pl.size+' KB</strong> after optimization) and might crash a retro browser. Click on the link below to open it anyway.</p>';
    erg += '<ul>';
    erg += '<li><a href="'+url+'">'+pl.meta.title+'</a></li>';
    erg += '</ul>';
    erg += this.closePage();

    erg = this.prepareHTML(erg);

    res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length' : erg.length});
    res.end(erg);
  }

}