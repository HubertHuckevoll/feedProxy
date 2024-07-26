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

export async function isArticle(url, html)
{
  const doc = new JSDOM(html, {url: url});
  return isReaderable(doc.window.document);
}

export async function getArticle(url, html)
{
  const doc = new JSDOM(html, {url: url});
  const reader = new articleExtractor(doc.window.document);

  const pageObj = reader.parse();
  pageObj.content = await removeTags(pageObj.content, true);
  pageObj.content = await removeAttrs(pageObj.content, true);
  pageObj.content = await boxImages(pageObj.content, true);
  pageObj.content = normalizeWhitespace(pageObj.content);

  return pageObj;
}

export async function getStrippedPage(url, html)
{
  let htm = html;
  htm = await removeTags(url, htm, false);
  htm = await removeAttrs(url, htm, false);

  // const markdown = convertHtmlToMarkdown(
  //   htm, {
  //     overrideDOMParser: new (new JSDOM({url: url})).window.DOMParser(),
  //     extractMainContent: true
  //   }
  // );
  // const md = markdownit();
  // htm = md.render(markdown);

  htm = await boxImages(url, htm, true);
  htm = normalizeWhitespace(htm);

  return htm;
}

export async function removeTags(url, html, htmlIsFragment)
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

  if (htmlIsFragment) {
    html = doc.documentElement.querySelector('body').innerHTML;
  } else {
    html = doc.documentElement.outerHTML;
  }

  return html;
}

export async function removeAttrs(url, html, htmlIsFragment)
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

  if (htmlIsFragment) {
    html = doc.documentElement.querySelector('body').innerHTML;
  } else {
    html = doc.documentElement.outerHTML;
  }

  return html;
}

export async function boxImages(url, html, htmlIsFragment)
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

  if (htmlIsFragment) {
    html = doc.documentElement.querySelector('body').innerHTML;
  } else {
    html = doc.documentElement.outerHTML;
  }

  return html;
}
