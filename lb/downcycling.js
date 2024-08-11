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
  // collapseInlineTagWhitespace: true,
  // collapseWhitespace: true,
  // conservativeCollapse: false,


  html = await minify(html, {
    continueOnParseError: true,
    noNewlinesBeforeTagClose: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true
  });

  let doc = tools.createDom(url, html);

  doc = removeElements(doc);
  doc = reworkImages(doc);
  doc = removeNonFormContainedFormElements(doc);
  doc = reworkTagsForHTML4(doc);
  doc = reduceNestedDivs(doc);
  doc = removeAttrs(doc);
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
  // remove unsupported elements
  const tags = `
    script, style, link,
    video, audio, source,
    object, embed, template,
    aside, dialog, time,
    svg, g
  `;
  doc = removeNodes(doc, tags);

  // remove "stuff"
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

  // remove JS-only links
  const sel = 'a[href^="javascript:"]';
  doc = removeNodes(doc, sel);

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

function reworkImages(doc)
{
  // rework "pictures"
  const pictures = doc.querySelectorAll('picture');
  pictures.forEach(element =>
  {
    const img = element.querySelector('img');
    if (img) element.parentNode.replaceChild(img, element);
  });

  // rework "figures"
  const figures = doc.querySelectorAll('figure');
  figures.forEach(element =>
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

      const box = doc.createElement('DIV');
      box.appendChild(img);

      element.parentNode.replaceChild(box, element);
    }
  });

  // remove inline images
  const imagesWithDataSrc = 'img[src^="data:"]';
  doc = removeNodes(doc, imagesWithDataSrc);

  // box images
  const tags = ['img'];
  tags.forEach((tag) =>
  {
    const tagsFound = doc.querySelectorAll(tag);
    tagsFound.forEach((tagFound) =>
    {
      let w = tagFound.getAttribute('width');
      if (w)
      {
        w = (w < globalThis.prefs.imagesMaxScaleSize) ? w : globalThis.prefs.imagesMaxScaleSize;
        tagFound.setAttribute('width', w);
        tagFound.removeAttribute('height');
      }
    });
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
  // const selectors = `
  //   div:empty, span:empty,
  //   li:empty, ul:empty, ol:empty,
  //   h1:empty, h2:empty, h3:empty, h4:empty, h5:empty, h6:empty,
  //   p:empty, section:empty, article:empty
  // `;
  // return removeNodes(doc, selectors);

  const singleTagElements = new Set(['br', 'img', 'input', 'meta', 'link', 'base', 'hr', 'param', 'source', 'track', 'col', 'wbr']);

  doc.body.querySelectorAll(':empty').forEach(node =>
  {
    if (!singleTagElements.has(node.nodeName.toLowerCase()))
    {
      node.remove();
    }
  });

  doc.body.innerHTML = doc.body.innerHTML.replace(/\s+/g, ' ').trim();

  const inlineElements = ['span', 'a', 'strong', 'b', 'em', 'i', 'abbr', 'cite', 'code', 'q', 'label', 'small', 'sub', 'sup'];

  inlineElements.forEach(tag =>
  {
    doc.body.querySelectorAll(`${tag} + ${tag}`).forEach(node =>
    {
        node.insertAdjacentText('beforebegin', ' ');
    });
  });

  doc.body.innerHTML = doc.body.innerHTML.replace(/>\s+</g, '><');

  return doc;
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
    let els = doc.querySelectorAll('div + div');
    changed = combine(els);
  }

  return doc;
}


/**
 *
 * Promising, but the results are extreme
 */
function removeIdenticalNodes(doc)
{

  function hashContent(content) {
    let hash = 0, i, chr;
    for (i = 0; i < content.length; i++) {
      chr = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash;
  }

  const contentMap = new Map();

  function processNode(node)
  {
    const textContent = node.textContent.trim();
    if (!textContent) return; // Skip nodes with empty or whitespace-only content

    const contentHash = hashContent(textContent);

    if (contentMap.has(contentHash))
    {
      if (['P', 'SPAN', 'DIV'].includes(node.tagName))
      {
        node.parentNode.removeChild(node);
      }
    }
    else
    {
      contentMap.set(contentHash, true);
    }
  }

  function traverseDOM(node)
  {
    // Convert the childNodes to an array to avoid mutation issues
    const children = Array.from(node.childNodes);

    children.forEach(child =>
    {
      if (child.nodeType === 1)
      {
        traverseDOM(child); // Recursively traverse the DOM
        processNode(child); // Process the node after its children
      }
    });
  }

  traverseDOM(doc.body);

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
