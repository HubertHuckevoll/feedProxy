import * as tools                               from '../lb/tools.js';
import { isProbablyReaderable as isReaderable } from '@mozilla/readability';
import { Readability as articleExtractor }      from '@mozilla/readability';

import DOMPurify                                from "isomorphic-dompurify";
import { minify }                               from "html-minifier-terser";

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

export function isArticle(url, html)
{
  const doc = tools.createDom(url, html);
  return isReaderable(doc);
}

export async function getArticle(url, html)
{
  let doc = tools.createDom(url, html);
  const reader = new articleExtractor(doc);
  const pageObj = reader.parse();
  html = pageObj.content;

  html = await reworkHTML(url, html);
  pageObj.content = html;

  return pageObj;
}

export async function getStrippedPage(url, html)
{
  html = await reworkHTML(url, html);
  return html;
}

async function reworkHTML(url, html)
{
  let doc = tools.createDom(url, html);

  doc = removeElements(doc);
  doc = removeAttrs(doc);
  doc = boxImages(doc);
  doc = removeInlineImages(doc);
  doc = replacePictureTags(doc);
  doc = removeNestedElems(doc, 'DIV');
  //doc = removeNestedElems(doc, 'SPAN'); // breaks Google.com

  html = doc.documentElement.outerHTML;

  html = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: globalThis.prefs.downcycleTags,
    KEEP_CONTENT: false,
  });

  html = await minify(html, {
    collapseInlineTagWhitespace: true,
    collapseWhitespace: true,
    conservativeCollapse: false,
    continueOnParseError: true,
    noNewlinesBeforeTagClose: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeEmptyElements: true,
    removeRedundantAttributes: true,
  });

  return html;
}

function removeElements(doc)
{
  const selectors = (globalThis.prefs.downcycleSelectors) ? globalThis.prefs.downcycleSelectors : [];

  selectors.forEach((selector) =>
  {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  return doc;
}

function removeAttrs(doc)
{
  const attrs = (globalThis.prefs.downcycleAttrsWhitelist) ? globalThis.prefs.downcycleAttrsWhitelist : [];

  const els = doc.querySelectorAll('*');
  els.forEach((el) =>
  {
    Object.values(el.attributes).forEach(({name}) =>
    {
      // remove dynamic attributes like data-
      if (name.includes('-'))
      {
        el.removeAttribute(name);
      }

      // remove all attributes that are not whitelisted
      let isAllowed = false;
      attrs.forEach((attr) =>
      {
        if (name == attr) isAllowed = true;
      });
      if (!isAllowed) el.removeAttribute(name);

    });
  });

  return doc;
}

function removeInlineImages(doc)
{
  const els = doc.querySelectorAll('img');

  els.forEach((el) =>
  {
    const attributes = el.attributes;

    // Alternatively, using Array.from() to convert NamedNodeMap to an array
    Array.from(attributes).forEach(attr =>
    {
      if ((attr.name == 'src') && (attr.value.includes('data:')))
      {
        el.remove();
      }
    });
  });

  return doc;
}

function replacePictureTags(doc)
{
  const elementsToReplace = doc.querySelectorAll('picture, figure');

  elementsToReplace.forEach(element =>
  {
    const img = element.querySelector('img');

    if (img)
    {
      // Finde die figcaption
      const figcaption = element.querySelector('figcaption');

      // Wenn eine figcaption gefunden wurde und das img kein alt-Attribut hat,
      // setze den Inhalt der figcaption als alt-Attribut
      if (figcaption && !img.hasAttribute('alt'))
      {
        img.alt = figcaption.textContent;
      }

      element.parentNode.replaceChild(img, element);
    }
  });

  return doc;
}

function removeNestedElems(doc, tagName)
{
  // Check if an element is empty (ignoring whitespace)
  const isEmpty = element => element.textContent.trim() === '';

  // Recursively remove unnecessary wrapper elements (usually span / div).
  const simplifyDivs = element =>
  {
    // If the element has no children, return early
    if (element.children.length === 0) return;

    // Process each child element
    for (let child of Array.from(element.children))
    {
      simplifyDivs(child); // Recursively simplify child elements
    }

    // If the element is a div and all its children are divs with no content, remove it
    if (element.tagName === tagName && Array.from(element.children).every(child => child.tagName === tagName && isEmpty(child)))
    {
      const parent = element.parentNode;
      while (element.firstChild)
      {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    }
  };

  simplifyDivs(doc.body);

  return doc;
}

function boxImages(doc)
{
  const tags = ['img'];

  tags.forEach((tag) =>
  {
    const tagsFound = doc.querySelectorAll(tag);
    tagsFound.forEach((tagFound) =>
    {
      let w = tagFound.getAttribute('width');
      if (w)
      {
        w = (w < 512) ? w : 512;
        tagFound.setAttribute('width', w);
        tagFound.removeAttribute('height');
      }
    });
  });

  return doc;
}
