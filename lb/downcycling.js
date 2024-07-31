import {JSDOM}                                  from 'jsdom';
import { isProbablyReaderable as isReaderable } from '@mozilla/readability';
import { Readability as articleExtractor }      from '@mozilla/readability';
import normalizeWhitespace                      from 'normalize-html-whitespace';
import fsSync                                   from 'fs';

/*
import {convertHtmlToMarkdown}                  from 'dom-to-semantic-markdown';
import markdownit                               from 'markdown-it'
const markdown = convertHtmlToMarkdown(
  htm, {
    overrideDOMParser: new (new JSDOM({url: url})).window.DOMParser(),
    extractMainContent: true
  }
);
const md = markdownit();
htm = md.render(markdown);
*/

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
  const doc = new JSDOM(html, {url: url});
  return isReaderable(doc.window.document);
}

export function getArticle(url, html)
{
  const doc = new JSDOM(html, {url: url});
  const reader = new articleExtractor(doc.window.document);

  const pageObj = reader.parse();
  pageObj.content = removeElements(url, pageObj.content);
  pageObj.content = removeAttrs(url, pageObj.content);
  pageObj.content = boxImages(url, pageObj.content);
  pageObj.content = removeComments(url, pageObj.content);
  //pageObj.content = removeEmptyNodes(url, pageObj.content);
  pageObj.content = normalizeWhitespace(pageObj.content);

  return pageObj;
}

export function getStrippedPage(url, html)
{
  let htm = html;

  htm = removeElements(url, htm);
  htm = removeAttrs(url, htm);
  htm = boxImages(url, htm);
  htm = removeComments(url, htm);
  //htm = removeEmptyNodes(url, htm);
  htm = normalizeWhitespace(htm);

  fsSync.writeFileSync('./dump.txt', htm);

  return htm;
}

export function removeElements(url, html)
{
  let doc = new JSDOM(html, {url: url}).window.document;
  const selectors = (globalThis.prefs.downcycleSelectors) ? globalThis.prefs.downcycleSelectors : [];

  selectors.forEach(selector =>
  {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  html = doc.documentElement.outerHTML;

  return html;
}

function removeEmptyNodes(url, html)
{
  let doc = new JSDOM(html, {url: url}).window.document;

  // Rekursive Funktion, um leere Knoten zu entfernen
  function removeEmptyNodesRec(node)
  {
    const childNodes = node.childNodes;

    // Iteriere rückwärts durch die Kindelemente, um Knoten sicher zu entfernen
    for (let i = childNodes.length - 1; i >= 0; i--)
    {
      const child = childNodes[i];

      // Entferne den Knoten, wenn er leer ist
      if ((child.nodeType === 3 && child.textContent == '') ||
          (child.nodeType === 1 && child.innerHTML == ''))
      {
        child.remove();
      }
      else
      {
        // Rekursiver Aufruf der Funktion für nicht leere Knoten
        removeEmptyNodesRec(child);
      }
    }
  }

  removeEmptyNodesRec(doc.body);
  html = doc.documentElement.outerHTML;

  return html;
}

export function removeAttrs(url, html)
{
  let doc = new JSDOM(html, {url: url}).window.document;
  const attrs = (globalThis.prefs.downcycleAttrs) ? globalThis.prefs.downcycleAttrs : [];
  const dynAttrs = (globalThis.prefs.downcycleDynAttrs) ? globalThis.prefs.downcycleDynAttrs : [];

  const els = doc.querySelectorAll('*');
  els.forEach((el) =>
  {
    attrs.forEach((attr) =>
    {
      if (el.hasAttribute(attr))
      {
        el.removeAttribute(attr);
      }
    });

    dynAttrs.forEach((dynAttr) =>
    {
      Object.values(el.attributes).forEach(({name}) =>
      {
        if (name.includes(dynAttr))
        {
          el.removeAttribute(name);
        }
      });
    });
  });

  html = doc.documentElement.outerHTML;

  return html;
}

// Function to remove comment nodes
export function removeComments(url, html)
{
  let doc = new JSDOM(html, {url: url}).window.document;

  const els = doc.querySelectorAll('*');
  els.forEach((el) =>
  {
    if (el.nodeType == globalThis.Node.COMMENT_NODE)
    {
      el.parentNode.removeChild(el);
    }
  });

  html = doc.documentElement.outerHTML;

  return html;
}

export function boxImages(url, html)
{
  let doc = new JSDOM(html, {url: url}).window.document;
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

  html = doc.documentElement.outerHTML;

  return html;
}
