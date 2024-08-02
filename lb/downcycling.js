import {JSDOM}                                  from 'jsdom';
import { isProbablyReaderable as isReaderable } from '@mozilla/readability';
import { Readability as articleExtractor }      from '@mozilla/readability';
import normalizeWhitespace                      from 'normalize-html-whitespace';

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
  let doc = new JSDOM(html, {url: url});
  const reader = new articleExtractor(doc.window.document);

  const pageObj = reader.parse();
  html = pageObj.content;
  html = reworkHTML(url, html);
  pageObj.content = html;

  return pageObj;
}

export function getStrippedPage(url, html)
{
  html = reworkHTML(url, html);
  return html;
}

function reworkHTML(url, html)
{
  let doc = new JSDOM(html, {url: url});
  doc = doc.window.document;

  doc = removeElements(doc);
  doc = removeAttrs(doc);
  doc = boxImages(doc);
  doc = removeComments(doc);
  doc = removeInlineImages(doc);
  doc = removeNestedDIVs(doc);
  // doc = removeEmptyNodes(doc);

  html = doc.documentElement.outerHTML;
  html = normalizeWhitespace(html);

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

function removeEmptyNodes(doc)
{
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

  return doc;
}

function removeAttrs(doc)
{
  const attrs = (globalThis.prefs.downcycleAttrs) ? globalThis.prefs.downcycleAttrs : [];
  const dynAttrs = (globalThis.prefs.downcycleDynAttrs) ? globalThis.prefs.downcycleDynAttrs : [];

  attrs.forEach(selector =>
  {
    const elements = doc.querySelectorAll("["+selector+"]");

    // Entferne das Attribut "selector" von jedem ausgewählten Element
    elements.forEach(element =>
    {
      element.removeAttribute(selector);
    });
  });

  const els = doc.querySelectorAll('*');
  els.forEach((el) =>
  {
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

  return doc;
}

// Function to remove comment nodes
function removeComments(doc)
{
  const els = doc.querySelectorAll('*');
  els.forEach((el) =>
  {
    if (el.nodeType == globalThis.Node.COMMENT_NODE)
    {
      el.parentNode.removeChild(el);
    }
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
  const els = doc.querySelectorAll('picture');

  els.forEach((el) =>
  {
    // Select the parent node
    const parentNode = el.parentNode;

    // Insert the children of the nodeToReplace before the nodeToReplace itself
    while (el.firstChild) {
        parentNode.insertBefore(el.firstChild, el);
    }

    // Remove the now empty nodeToReplace
    parentNode.removeChild(el);
  });

  return doc;
}

function removeNestedDIVs(doc)
{
  const els = doc.querySelectorAll('div');

  function removeNestedDivsRec(element)
  {
    if (element.children.length === 1 && element.children[0].tagName === 'DIV')
    {
      let child = element.children[0];
      while (child.children.length === 1 && child.children[0].tagName === 'DIV')
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
        removeNestedDivsRec(child); // Recursively check the new child
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
        if (child.tagName === 'DIV')
        {
          removeNestedDivsRec(child);
        }
      });
    }
  }

  els.forEach(div => {
    removeNestedDivsRec(div);
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
