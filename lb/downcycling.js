import {JSDOM}                                  from 'jsdom';
import { isProbablyReaderable as isReaderable } from '@mozilla/readability';
import { Readability as articleExtractor }      from '@mozilla/readability';
import normalizeWhitespace                      from 'normalize-html-whitespace';

import {convertHtmlToMarkdown}                  from 'dom-to-semantic-markdown';
import markdownit                               from 'markdown-it'
global.Node = {
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
  pageObj.content = removeTags(url, pageObj.content);
  pageObj.content = removeAttrs(url, pageObj.content);
  pageObj.content = removeComments(url, pageObj.content);
  pageObj.content = boxImages(url, pageObj.content);
  pageObj.content = normalizeWhitespace(pageObj.content);

  return pageObj;
}

export function getStrippedPage(url, html)
{
  let htm = html;

  htm = removeTags(url, htm);
  htm = removeAttrs(url, htm);
  htm = removeComments(url, htm);

  /*
  const markdown = convertHtmlToMarkdown(
    htm, {
      overrideDOMParser: new (new JSDOM({url: url})).window.DOMParser(),
      extractMainContent: true
    }
  );
  const md = markdownit();
  htm = md.render(markdown);
  */

  htm = boxImages(url, htm);
  htm = normalizeWhitespace(htm);

  return htm;
}

export function removeTags(url, html)
{
  let doc = new JSDOM(html, {url: url}).window.document;
  const tags = (globalThis.prefs.downcycleTags) ? globalThis.prefs.downcycleTags : [];

  tags.forEach((tag) =>
  {
    const tagsFound = doc.querySelectorAll(tag);
    tagsFound.forEach((tagFound) =>
    {
      tagFound.parentNode.removeChild(tagFound);
    });
  });

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
    if (el.nodeType == 8)
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
