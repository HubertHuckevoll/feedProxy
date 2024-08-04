import * as tools                               from '../lb/tools.js';
import { isProbablyReaderable as isReaderable } from '@mozilla/readability';
import { Readability as articleExtractor }      from '@mozilla/readability';

import DOMPurify                                from "isomorphic-dompurify";
import { minify }                               from "html-minifier-terser";


globalThis.Node = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
};

export function isArticle(url, html)
{
  const doc = tools.createDom(url, html);
  return isReaderable(doc.window.document);
}

export async function getArticle(url, html)
{
  let doc = tools.createDom(url, html);
  const reader = new articleExtractor(doc.window.document);
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
  doc = doc.window.document;

  doc = removeElements(doc);
  doc = removeAttrs(doc);
  doc = boxImages(doc);
  doc = removeInlineImages(doc);
  doc = replacePictureTags(doc);
  doc = removeNestedElems(doc, 'div');
  //doc = removeNestedElems(doc, 'span'); // breaks Google.com

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
  // Funktion zum Ersetzen von Tags durch ihren Inhalt
  function replaceWithContents(element)
  {
    const parent = element.parentNode;
    while (element.firstChild)
    {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  // Entferne alle figure-Tags und behalte die img-Tags bei
  const figures = doc.querySelectorAll("figure");
  figures.forEach(figure => replaceWithContents(figure));

  // Entferne alle picture-Tags und behalte die img-Tags bei
  const pictures = doc.querySelectorAll("picture");
  pictures.forEach(picture => replaceWithContents(picture));

  return doc;
}

function removeNestedElems(doc, tagName)
{
  const els = doc.querySelectorAll(tagName);

  function removeNestedElemsRec(element)
  {
    if (element.children.length === 1 && (element.children[0].tagName === tagName.toUpperCase()))
    {
      let child = element.children[0];
      while (child.children.length === 1 && (element.children[0].tagName === tagName.toUpperCase()))
      {
        child = child.children[0];
      }
      if (child.children.length > 0 || child.textContent.trim() !== '')
      {
        // Move the content up
        if (element.parentNode)
        {
          element.parentNode.insertBefore(child, element);
          element.parentNode.removeChild(element);
        }
        removeNestedElemsRec(child); // Recursively check the new child
      }
      else
      {
        if (element.parentNode)
        {
          element.parentNode.removeChild(element);
        }
      }
    }
    else
    {
      Array.from(element.children).forEach(child =>
      {
        if (child.tagName === tagName.toUpperCase())
        {
          removeNestedElemsRec(child);
        }
      });
    }
  }

  els.forEach(el => {
    removeNestedElemsRec(el);
  });

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
