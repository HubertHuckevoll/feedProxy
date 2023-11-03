import { BaseV }          from '../vw/BaseV.js';

export class OverloadWarningV extends BaseV
{
  /**
   * Overview
   * ________________________________________________________________
   */
  draw(url, meta, size)
  {
    let erg = '';
    url = this.setUrlFeedProxyParam(url, 'loadingConfirmed');

    erg += this.openPage();
    erg += '<img src="'+meta.image+'" width="196"><br>';
    erg += '<h1>'+((meta.title != '') ? meta.title : url) +'</h1>';
    erg += '<p>'+((meta.description != '') ? meta.description : 'No description available.')+'</p>';
    erg += '<hr>';
    erg += '<h3>Warning!</h3>';
    erg += '<p>The page you\'re trying to load is pretty big (at least '+size+' kB before optimization) and might crash a retro browser. Click on the link below to open it anyway.</p>';
    erg += '<ul>';
    erg += '<li><a href="'+url+'"><span>'+url+'</span></a></li>';
    erg += '</ul>';
    erg += this.closePage();

    return this.prepareHTML(erg);
  }

}