import * as html5entities     from 'html-entities';
import iconvLite              from 'iconv-lite';

export class BaseV
{
  /**
   * Entities
   * ________________________________________________________________
   */
  constructor(prefs)
  {
    this.prefs = prefs;
  }

  /**
   * strip tags, replace entities with char symbols
   * _______________________________________________________________
   */
  HTML2Text(str)
  {
    str = str.replace(/(<([^>]+)>)/gi, "");
    str = html5entities.decode(str);

    return str;
  }

  /**
   * Downgrade to ASCII
   * what can not be downgraded will be converted to HTML entities (see below)
   * ________________________________________________________________
   */
  Utf8ToAscii(str)
  {
    const bytes = iconvLite.encode(Buffer.from(str, 'UTF-8'), 'ASCII//TRANSLIT'); // works somewhat
    return bytes.toString();
  }

  /**
   * UTF8 to ASCII + HTML Entities
   * FIXME: we just ignore < and > in the conversion to make sure HTML tags are not
   * converted, but this feels bad...
   * all HTML4 entities as defined here: http://www.w3.org/TR/html4/sgml/entities.html
   * added: amp, lt, gt, quot and apos
   * _______________________________________________________________
  */
  Utf8ToHTML(text)
  {
    const nonChar = '_';
    const entityTable =
    {
      34 : 'quot',
      38 : 'amp',
      39 : 'apos',
      60 : 'lt',
      62 : 'gt',
      160 : 'nbsp',
      161 : 'iexcl',
      162 : 'cent',
      163 : 'pound',
      164 : 'curren',
      165 : 'yen',
      166 : 'brvbar',
      167 : 'sect',
      168 : 'uml',
      169 : 'copy',
      170 : 'ordf',
      171 : 'laquo',
      172 : 'not',
      173 : 'shy',
      174 : 'reg',
      175 : 'macr',
      176 : 'deg',
      177 : 'plusmn',
      178 : 'sup2',
      179 : 'sup3',
      180 : 'acute',
      181 : 'micro',
      182 : 'para',
      183 : 'middot',
      184 : 'cedil',
      185 : 'sup1',
      186 : 'ordm',
      187 : 'raquo',
      188 : 'frac14',
      189 : 'frac12',
      190 : 'frac34',
      191 : 'iquest',
      192 : 'Agrave',
      193 : 'Aacute',
      194 : 'Acirc',
      195 : 'Atilde',
      196 : 'Auml',
      197 : 'Aring',
      198 : 'AElig',
      199 : 'Ccedil',
      200 : 'Egrave',
      201 : 'Eacute',
      202 : 'Ecirc',
      203 : 'Euml',
      204 : 'Igrave',
      205 : 'Iacute',
      206 : 'Icirc',
      207 : 'Iuml',
      208 : 'ETH',
      209 : 'Ntilde',
      210 : 'Ograve',
      211 : 'Oacute',
      212 : 'Ocirc',
      213 : 'Otilde',
      214 : 'Ouml',
      215 : 'times',
      216 : 'Oslash',
      217 : 'Ugrave',
      218 : 'Uacute',
      219 : 'Ucirc',
      220 : 'Uuml',
      221 : 'Yacute',
      222 : 'THORN',
      223 : 'szlig',
      224 : 'agrave',
      225 : 'aacute',
      226 : 'acirc',
      227 : 'atilde',
      228 : 'auml',
      229 : 'aring',
      230 : 'aelig',
      231 : 'ccedil',
      232 : 'egrave',
      233 : 'eacute',
      234 : 'ecirc',
      235 : 'euml',
      236 : 'igrave',
      237 : 'iacute',
      238 : 'icirc',
      239 : 'iuml',
      240 : 'eth',
      241 : 'ntilde',
      242 : 'ograve',
      243 : 'oacute',
      244 : 'ocirc',
      245 : 'otilde',
      246 : 'ouml',
      247 : 'divide',
      248 : 'oslash',
      249 : 'ugrave',
      250 : 'uacute',
      251 : 'ucirc',
      252 : 'uuml',
      253 : 'yacute',
      254 : 'thorn',
      255 : 'yuml',
      402 : 'fnof',
      913 : 'Alpha',
      914 : 'Beta',
      915 : 'Gamma',
      916 : 'Delta',
      917 : 'Epsilon',
      918 : 'Zeta',
      919 : 'Eta',
      920 : 'Theta',
      921 : 'Iota',
      922 : 'Kappa',
      923 : 'Lambda',
      924 : 'Mu',
      925 : 'Nu',
      926 : 'Xi',
      927 : 'Omicron',
      928 : 'Pi',
      929 : 'Rho',
      931 : 'Sigma',
      932 : 'Tau',
      933 : 'Upsilon',
      934 : 'Phi',
      935 : 'Chi',
      936 : 'Psi',
      937 : 'Omega',
      945 : 'alpha',
      946 : 'beta',
      947 : 'gamma',
      948 : 'delta',
      949 : 'epsilon',
      950 : 'zeta',
      951 : 'eta',
      952 : 'theta',
      953 : 'iota',
      954 : 'kappa',
      955 : 'lambda',
      956 : 'mu',
      957 : 'nu',
      958 : 'xi',
      959 : 'omicron',
      960 : 'pi',
      961 : 'rho',
      962 : 'sigmaf',
      963 : 'sigma',
      964 : 'tau',
      965 : 'upsilon',
      966 : 'phi',
      967 : 'chi',
      968 : 'psi',
      969 : 'omega',
      977 : 'thetasym',
      978 : 'upsih',
      982 : 'piv',
      8226 : 'bull',
      8230 : 'hellip',
      8242 : 'prime',
      8243 : 'Prime',
      8254 : 'oline',
      8260 : 'frasl',
      8472 : 'weierp',
      8465 : 'image',
      8476 : 'real',
      8482 : 'trade',
      8501 : 'alefsym',
      8592 : 'larr',
      8593 : 'uarr',
      8594 : 'rarr',
      8595 : 'darr',
      8596 : 'harr',
      8629 : 'crarr',
      8656 : 'lArr',
      8657 : 'uArr',
      8658 : 'rArr',
      8659 : 'dArr',
      8660 : 'hArr',
      8704 : 'forall',
      8706 : 'part',
      8707 : 'exist',
      8709 : 'empty',
      8711 : 'nabla',
      8712 : 'isin',
      8713 : 'notin',
      8715 : 'ni',
      8719 : 'prod',
      8721 : 'sum',
      8722 : 'minus',
      8727 : 'lowast',
      8730 : 'radic',
      8733 : 'prop',
      8734 : 'infin',
      8736 : 'ang',
      8743 : 'and',
      8744 : 'or',
      8745 : 'cap',
      8746 : 'cup',
      8747 : 'int',
      8756 : 'there4',
      8764 : 'sim',
      8773 : 'cong',
      8776 : 'asymp',
      8800 : 'ne',
      8801 : 'equiv',
      8804 : 'le',
      8805 : 'ge',
      8834 : 'sub',
      8835 : 'sup',
      8836 : 'nsub',
      8838 : 'sube',
      8839 : 'supe',
      8853 : 'oplus',
      8855 : 'otimes',
      8869 : 'perp',
      8901 : 'sdot',
      8968 : 'lceil',
      8969 : 'rceil',
      8970 : 'lfloor',
      8971 : 'rfloor',
      9001 : 'lang',
      9002 : 'rang',
      9674 : 'loz',
      9824 : 'spades',
      9827 : 'clubs',
      9829 : 'hearts',
      9830 : 'diams',
      338 : 'OElig',
      339 : 'oelig',
      352 : 'Scaron',
      353 : 'scaron',
      376 : 'Yuml',
      710 : 'circ',
      732 : 'tilde',
      8194 : 'ensp',
      8195 : 'emsp',
      8201 : 'thinsp',
      8204 : 'zwnj',
      8205 : 'zwj',
      8206 : 'lrm',
      8207 : 'rlm',
      8211 : 'ndash',
      8212 : 'mdash',
      8216 : 'lsquo',
      8217 : 'rsquo',
      8218 : 'sbquo',
      8220 : 'ldquo',
      8221 : 'rdquo',
      8222 : 'bdquo',
      8224 : 'dagger',
      8225 : 'Dagger',
      8240 : 'permil',
      8249 : 'lsaquo',
      8250 : 'rsaquo',
      8364 : 'euro'
    };

    if (this.prefs.encodingUseOlderHTMLEntities)
    {
      /**
        * Older versions of GEOS don't know about some of the newer entities, so we replace them with
        * something old after the translation.

        '	einfaches Anführungszeichen (Apostroph)	&apos;	&#x0027;
        "	Anführungszeichen (Doppel-Apostroph)	&quot;	&#x0022;
        ‚	einfaches Anführungszeichen unten "9" (Deutsch: auf)	&sbquo;
        ‘	einf. Anführungszeichen oben "6" (Deutsch: zu / Englisch: auf)	&lsquo;
        ’	einfaches Anführungszeichen oben "9" (Englisch: zu)	&rsquo;	&#x2019;
        „	doppelte Anführungszeichen unten "99" (Deutsch: auf)	&bdquo;	&#x201E;
        “	dopp. Anführungszeichen oben "66" (Deutsch: zu / Englisch: auf)	&ldquo;
        ”	doppelte Anführungszeichen oben "99" (Englisch: zu)	&rdquo;	&#x201D;
        ‹	spitzes Anführungszeichen links (Französisch: auf)	&lsaquo;	&#x2039;
        ›	spitzes Anführungszeichen rechts (Französisch: zu)	&rsaquo;	&#x203A;
        «	doppelte spitze Anführungszeichen links (frz. Guillemets: auf)	&laquo;	&#x00AB;
        »	doppelte spitze Anführungszeichen rechts (frz. Guillemets: zu)	&raquo;	&#x00BB;
      */

      var entityGeosPatchTable =
      {
        ndash: '-',
        mdash: '-',
        sbquo: '\'',
        lsquo: '\'',
        rsquo: '\'',
        bdquo: '&quot;',
        ldquo: '&quot;',
        rdquo: '&quot;',
        lsaquo: '<',
        rsaquo: '>',
        hellip: '...',
        euro: 'EUR',
        minus: '-'
      }
    }

    if (text)
    {
      // original Regex, including tags: /[\u00A0-\u2666<>\&]/g
      text = text.replace(/[\u00A0-\u2666]/g, (c) =>
        {
          let ent = '';
          ent = (entityTable[c.charCodeAt(0)]) ? entityTable[c.charCodeAt(0)] : nonChar;
          if (ent !== nonChar)
          {
            if (this.prefs.encodingUseOlderHTMLEntities)
            {
              ent = (entityGeosPatchTable[ent]) ? entityGeosPatchTable[ent] : '&'+ent+';';
            }
            else
            {
              ent = '&'+ent+';';
            }
          }

          return ent;
        }
      );
    }

    return text;
  }

  /**
   *
   * add value of the feedProxy component to the url
   * ________________________________________________________________
   */
  setUrlFeedProxyParam(url, val)
  {
    let link = new URL(url);
    let params = link.searchParams;
    params.set('feedProxy', val);
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
    let enc = 'UTF-8'; // ASCII with entities should still be valid UTF-8

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
   * Fix up the html for retro browsers
   * ________________________________________________________________
   */
   prepareHTML(html)
  {
    html = this.https2http(html);
    html = this.transformEncoding(html);
    //html = this.Utf8ToAscii(html);

    return html;
  }

  https2http(html)
  {
    html = html.replace(/https\:\/\//gi, 'http://');

    return html;
  }

  transformEncoding(html)
  {
    if (this.prefs.encodingUTF8toAsciiAndEntities)
    {
      html = this.Utf8ToHTML(html);
    }
    return html;
  }

}