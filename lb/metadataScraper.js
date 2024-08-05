import * as tools             from './tools.js';


/******************************************************************
 * entry point
 *****************************************************************/
export async function get(url, html)
{
  const doc = tools.createDom(url, html);
  const ret =
  {
    title: extractTitle(doc),
    description: extractDescription(doc),
    image: extractImage(doc, url),
    isHTML5: isHTML5(doc)
  };

  return ret;
}

/******************************************************************
 * the following function written by ChatGPT
 *****************************************************************/
function isHTML5(doc)
{
  const doctype = doc.doctype;

  // Analyse des DOCTYPE
  if (doctype) {
    const { name, publicId, systemId } = doctype;

    if (name.toLowerCase() === "html") {
      if (!publicId && !systemId) {
        return true; // HTML5
      }

      if (publicId.includes("HTML 4.01") || publicId.includes("XHTML 1.0")) {
        return false; // HTML4
      }
    }
  }

  // HTML5-Merkmale: Tags und Attribute
  const html5Elements = ['article', 'section', 'nav', 'aside', 'header', 'footer', 'figure', 'figcaption', 'main', 'time', 'mark', 'progress', 'meter', 'details', 'summary', 'output'];
  const html5Attributes = ['contenteditable', 'draggable', 'contextmenu', 'spellcheck', 'async', 'defer', 'autoplay', 'autofocus', 'form', 'list', 'placeholder', 'required', 'novalidate'];

  for (const tag of html5Elements) {
    if (doc.querySelector(tag)) {
      return true; // HTML5
    }
  }

  for (const attribute of html5Attributes) {
    if (doc.querySelector(`[${attribute}]`)) {
      return true; // HTML5
    }
  }

  // HTML4-Merkmale: Veraltete Tags und Attribute
  const deprecatedHTML4Tags = ['font', 'center', 'bgsound', 'basefont', 'applet', 'isindex', 'dir'];
  const deprecatedHTML4Attributes = ['align', 'bgcolor', 'border', 'marginwidth', 'marginheight', 'vspace', 'hspace'];

  for (const tag of deprecatedHTML4Tags) {
    if (doc.querySelector(tag)) {
      return false; // HTML4
    }
  }

  for (const attribute of deprecatedHTML4Attributes) {
    if (doc.querySelector(`[${attribute}]`)) {
      return false; // HTML4
    }
  }

  // Zusätzliche HTML5 Indikatoren
  if (doc.querySelector('meta[charset]') || doc.querySelector('meta[http-equiv="Content-Type"]')?.content?.includes("charset")) {
    return true; // HTML5
  }

  // Zusätzliche HTML4 Indikatoren
  if (doc.querySelector('meta[http-equiv="Content-Type"]') || doc.querySelector('frame, frameset, iframe[longdesc]')) {
    return false; // HTML4
  }

  // Standardmäßig "Unknown" als HTML5
  return true;
}

function extractTitle(doc)
{
  let node = '';
  let result = '';

  node = doc.querySelector('meta[property="og:title"]');
  result = (node !== null) ? node.getAttribute('content').trim() : '';

  if (result === '')
  {
    node = doc.querySelector('meta[property="twitter:title"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';
  }

  if (result === '')
  {
    node = doc.querySelector('head title');
    result = (node !== null) ? node.textContent.trim() : '';
  }

  return result;
}

function extractDescription(doc)
{
  let node = '';
  let result = '';

  node = doc.querySelector('meta[property="og:description"]');
  result = (node !== null) ? node.getAttribute('content').trim() : '';

  if (result === '')
  {
    node = doc.querySelector('meta[property="twitter:description"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';
  }

  if (result === '')
  {
    node = doc.querySelector('meta[name="description"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';
  }

  return result;
}

function extractImage(doc, url)
{
  let node = '';
  let result = '';
  const tld = tools.tldFromUrl(url);

  node = doc.querySelector('meta[property="og:image"]');
  result = (node !== null) ? node.getAttribute('content').trim() : '';

  if (result === '')
  {
    node = doc.querySelector('meta[property="twitter:image"]');
    result = (node !== null) ? node.getAttribute('content').trim() : '';
  }

  if (result === '')
  {
    node = doc.querySelector('link[rel="apple-touch-icon"');
    result = (node !== null) ? node.getAttribute('href').trim() : '';
  }

  if (result.startsWith('//'))
  {
    result = 'http:' + result;
  }
  else
  {
    if (result.startsWith('/'))
    {
      result = tld + result;
    }
  }

  return result;
}
