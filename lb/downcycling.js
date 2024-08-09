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

  html = await minify(html, {
    collapseInlineTagWhitespace: true,
    collapseWhitespace: true,
    conservativeCollapse: false,
    continueOnParseError: true,
    noNewlinesBeforeTagClose: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true
  });

  let doc = tools.createDom(url, html);

  doc = removeElements(doc);
  doc = removeAttrs(doc);
  doc = removeInlineImages(doc);
  doc = replacePictureTags(doc);
  doc = boxImages(doc);
  doc = reworkTagsForHTML4(doc);
  doc = removeNonFormContainedFormElements(doc);
  doc = reduceNestedDivs(doc);
  doc = removeEmptyElements(doc);
  doc = combineNeighbours(doc);

  //html = doc.documentElement.outerHTML;
  html = doc.body.innerHTML;

  html = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true }
  });

  return html;
}

function removeElements(doc)
{
  const tags = `
    script, style, link,
    video, audio, source,
    object, embed, template,
    aside, dialog, svg, time
  `;

  doc = removeNodes(doc, tags);

  const selectors = `
    .sidebar, .ad, .ads, .advertisement,
    .ad-container, .ad-banner, .ad-unit,
    .ad-slot, .ad-wrapper, .ad-section,
    .ad-space, .adbox, .adsidebar,
    .sponsored, .sponsor, .promo,
    .promotional, .commercial, .advert,
    .advertising, .banner, .ad-placeholder,
    .advertisement-label, .adsbygoogle
  `;

  doc = removeNodes(doc, selectors);

  return doc;
}

function removeAttrs(doc)
{
  const downcycleAttrsWhitelist = [
    "accept", "accept-charset", "accesskey",
    "action", "align", "alt",
    "async", "background", "bgcolor",
    "border", "cellpadding", "cellspacing",
    "char", "charoff", "charset",
    "checked", "cite",
    "clear", "code", "codebase",
    "color", "cols", "colspan",
    "compact", "content", "coords",
    "data", "datetime", "declare",
    "defer", "dir", "disabled",
    "enctype", "face", "for",
    "frame", "frameborder", "headers",
    "height", "href", "hreflang",
    "hspace", "http-equiv",
    "ismap", "label", "lang",
    "language", "link", "longdesc",
    "marginheight", "marginwidth", "maxlength",
    "media", "method", "multiple",
    "name", "nohref", "noshade",
    "nowrap", "object", "profile",
    "prompt", "readonly",
    "rev", "rows", "rowspan",
    "rules", "scheme", "scope",
    "scrolling", "selected", "shape",
    "size", "span", "src",
    "standby", "start",
    "summary", "tabindex", "target",
    "text", "title", "type",
    "usemap", "valign", "value",
    "valuetype", "version", "vlink",
    "vspace", "width"
  ];

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
      downcycleAttrsWhitelist.forEach((attr) =>
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
  const imagesWithDataSrc = 'img[src^="data:"]';

  return removeNodes(doc, imagesWithDataSrc);
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

function reworkTagsForHTML4(doc)
{
  // HTML5 zu HTML4 Mapping
  const tagMapping = {
    "article": "div",
    "aside": "div",
    "bdi": "span",
    "details": "div",
    "dialog": "div",
    "figcaption": "div",
    "figure": "div",
    "footer": "div",
    "header": "div",
    "main": "div",
    "mark": "span",
    "meter": "span",
    "nav": "div",
    "output": "span",
    "progress": "span",
    "section": "div",
    "summary": "div",
    "time": "span",
    "abbr": "span",
    "address": "div",
    "bdo": "span",
    "data": "span",
    "rp": "span",
    "rt": "span",
    "ruby": "span",
    "wbr": "span"
  };

  // Tags transformieren
  Object.keys(tagMapping).forEach(tag =>
  {
    const elements = doc.querySelectorAll(tag);
    elements.forEach((element) =>
    {
      // Neues Element mit dem Ersatz-Tag erstellen
      const newElement = doc.createElement(tagMapping[tag]);

      // Attribute kopieren
      Array.from(element.attributes).forEach(attr => {
        newElement.setAttribute(attr.name, attr.value);
      });

      // Kindknoten verschieben
      while (element.firstChild) {
        newElement.appendChild(element.firstChild);
      }

      // Altes Element durch neues Element ersetzen
      element.parentNode.replaceChild(newElement, element);
    });
  });

  return doc;
}

function reduceNestedDivs(doc)
{
  function unwrapDiv(element)
  {
    const parent = element.parentNode;
    if (parent && parent.nodeName !== 'BODY')
    {
        while (element.firstChild)
        {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
    }
  }

  let hasUnwrapped;
  do
  {
    hasUnwrapped = false;
    const elements = doc.querySelectorAll("div > div");

    elements.forEach(element =>
    {
      const parent = element.parentNode;
      const grandparent = parent ? parent.parentNode : null;

      // Only unwrap if the grandparent is not BODY and the parent is a DIV
      if (grandparent && grandparent.nodeName !== 'BODY' && parent.nodeName === 'DIV')
      {
        unwrapDiv(parent);
        hasUnwrapped = true;
      }
    });
  }
  while (hasUnwrapped)

  return doc;
}

function removeEmptyElements(doc)
{
  const selectors = `
    div:empty, span:empty,
    li:empty, ul:empty, ol:empty,
    h1:empty, h2:empty, h3:empty, h4:empty, h5:empty, h6:empty,
    p:empty, section:empty, article:empty
  `;

  return removeNodes(doc, selectors);
}

function removeNonFormContainedFormElements(doc)
{
  const selectors = `
    input:not(form input),
    select:not(form select),
    textarea:not(form textarea),
    button:not(form button)
  `;

  return removeNodes(doc, selectors);
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

function combineNeighbours(doc)
{
  let changed = true;

  function combine(els)
  {
    let changed = false;
    els.forEach(paragraph =>
    {
        const previousParagraph = paragraph.previousElementSibling;
        previousParagraph.innerHTML += '<br>' + paragraph.innerHTML;
        paragraph.remove();
        changed = true;
    });

    return changed;
  }

  while(changed)
  {
    let els = doc.querySelectorAll('p + p, div + div, span + span');
    changed = combine(els);
  }

  return doc;
}

function removeNodes(doc, selectors)
{
  let changed = true;

  function remove(els)
  {
    let changed = false;
    els.forEach((el) => {
      el.remove();
      changed = true;
    });
    return changed;
  }

  while(changed)
  {
    let els = doc.querySelectorAll(selectors);
    changed = remove(els);
  }

  return doc;
}
