import * as tools                               from '../lb/tools.js';

/*
  for reference:
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
*/

export async function applyPatches(url, html)
{
  let doc = tools.createDom(url, html);
  const domain = tools.domainFromURL(url);

  if (domain.includes('google.')) doc = fixGoogleLinks(url, doc);

  html = doc.body.innerHTML;
  return html;
}

function fixGoogleLinks(url, doc)
{
  doc.querySelectorAll('a[href^="/url?').forEach((el) =>
  {
    const orgUrl = new URL(el.getAttribute('href'), url);
    let newUrl = new URL(orgUrl).searchParams.get('q');
    newUrl = decodeURIComponent(newUrl);

    el.setAttribute('href', newUrl);
  });

  return doc;
}

