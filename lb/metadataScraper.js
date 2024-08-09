import * as tools             from './tools.js';


/******************************************************************
 * entry point
 *****************************************************************/
export async function getMetadata(url, html)
{
  const doc = tools.createDom(url, html);
  const ret =
  {
    title: extractTitle(doc),
    description: extractDescription(doc),
    image: extractImage(doc, url),
    isHTML5: isModernHTML(doc)
  };

  return ret;
}

/******************************************************************
 * the following function written by ChatGPT
 *****************************************************************/
function isModernHTML(doc)
{
  // Doctype reference data for different HTML versions
  const doctypes = {
    HTML2: {
      publicId: "-//IETF//DTD HTML 2.0//EN",
      systemId: null
    },
    HTML3: {
      publicId: "-//W3C//DTD HTML 3.2 Final//EN",
      systemId: null
    },
    HTML4_Strict: {
      publicId: "-//W3C//DTD HTML 4.01//EN",
      systemId: "http://www.w3.org/TR/html4/strict.dtd"
    },
    HTML4_Transitional: {
      publicId: "-//W3C//DTD HTML 4.01 Transitional//EN",
      systemId: "http://www.w3.org/TR/html4/loose.dtd"
    },
    HTML4_Frameset: {
      publicId: "-//W3C//DTD HTML 4.01 Frameset//EN",
      systemId: "http://www.w3.org/TR/html4/frameset.dtd"
    },
    XHTML1_Strict: {
      publicId: "-//W3C//DTD XHTML 1.0 Strict//EN",
      systemId: "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"
    },
    XHTML1_Transitional: {
      publicId: "-//W3C//DTD XHTML 1.0 Transitional//EN",
      systemId: "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"
    },
    XHTML1_Frameset: {
      publicId: "-//W3C//DTD XHTML 1.0 Frameset//EN",
      systemId: "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd"
    },
    XHTML11: {
      publicId: "-//W3C//DTD XHTML 1.1//EN",
      systemId: "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"
    },
    HTML5: {
      publicId: "",
      systemId: ""
    }
  };

  // Heuristic checks for HTML5
  function isHTML5() {
    const html5Elements = ["article", "section", "nav", "header", "footer", "figure", "figcaption", "aside", "main"];
    const html5InputTypes = ["date", "email", "number", "range"];

    // Check for new HTML5 elements
    let hasHTML5Elements = html5Elements.some(tag => doc.getElementsByTagName(tag).length > 0);

    // Check for new HTML5 input types
    let hasHTML5InputTypes = Array.from(doc.getElementsByTagName('input')).some(input => html5InputTypes.includes(input.type));

    return hasHTML5Elements || hasHTML5InputTypes;
  }

  // Heuristic checks for HTML4
  function isHTML4() {
    const html4Attributes = ["align", "bgcolor", "border", "frameborder", "marginwidth", "marginheight", "scrolling"];
    const html4Tags = ["center", "font", "basefont", "isindex", "dir"];

    // Check for HTML4 specific attributes
    let hasHTML4Attributes = html4Attributes.some(attr => doc.querySelector(`[${attr}]`));

    // Check for HTML4 specific tags
    let hasHTML4Tags = html4Tags.some(tag => doc.getElementsByTagName(tag).length > 0);

    return hasHTML4Attributes || hasHTML4Tags;
  }

  // Heuristic checks for HTML3
  function isHTML3() {
    const html3Tags = ["menu", "plaintext", "xmp"];
    const html3Attributes = ["name", "compact"];

    // Check for HTML3 specific tags
    let hasHTML3Tags = html3Tags.some(tag => doc.getElementsByTagName(tag).length > 0);

    // Check for HTML3 specific attributes
    let hasHTML3Attributes = html3Attributes.some(attr => doc.querySelector(`[${attr}]`));

    return hasHTML3Tags || hasHTML3Attributes;
  }

  const doctype = doc.doctype;

  if (doctype)
  {
    const doctypeInfo = {
      name: doctype.name,
      publicId: doctype.publicId,
      systemId: doctype.systemId
    };

    // Compare the extracted doctype information with known doctypes
    for (let version in doctypes)
    {
      if (doctypes[version].publicId === doctypeInfo.publicId &&
          doctypes[version].systemId === doctypeInfo.systemId)
      {
        // Checks for HTML5 or XHTML
        if (version === "HTML5" || version.startsWith("XHTML"))
        {
            return true;
        }
      }
    }
  }

  // Heuristic checks if no exact match found
  if (isHTML5())
  {
    return true;
  }
  else if (isHTML4() || isHTML3())
  {
    return false;
  }

  return null; // no valid (X)HTML found, XML?
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
  return null;
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
