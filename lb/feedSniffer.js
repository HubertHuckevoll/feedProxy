import * as tools             from './tools.js';
import { JSDOM }              from 'jsdom';

// Hauptfunktion zum Finden von RSS-Feed-URLs
export async function getFeeds(baseUrl, htmlString)
{
  const foundFeeds = [];
  const urlsToTest = generateFeedUrls(baseUrl);

  // Testen der Standard-Feed-URLs
  tools.cLog('feedSniffer: checking the usual suspects for', baseUrl);
  for (const url of urlsToTest) {
      if (await testFeedUrl(url)) {
          foundFeeds.push(url);
      }
  }

  // Überprüfung der Meta-Tags im HTML-Quellcode
  tools.cLog('feedSniffer: checking the DOM for', baseUrl);
  const doc = tools.createDom(baseUrl, htmlString);
  const linkTags = doc.querySelectorAll('link[rel="alternate"]');
  for (const link of linkTags) {
      const type = link.getAttribute('type');
      if (type === 'application/rss+xml' || type === 'application/atom+xml') {
          const href = link.getAttribute('href');
          if (await testFeedUrl(href) && !foundFeeds.includes(href)) {
              foundFeeds.push(href);
          }
      }
  }

  // Überprüfung der `robots.txt`
  try
  {
      tools.cLog('feedSniffer: checking robots.txt for', baseUrl);
      const robotsUrl = new URL('/robots.txt', baseUrl).href;
      const robotsResponse = await tools.rFetchUrl(robotsUrl);
      if (robotsResponse.ok)
      {
          const robotsText = await robotsResponse.text();
          const sitemapMatch = robotsText.match(/Sitemap:\s*(\S+)/);
          if (sitemapMatch) {
              const sitemapUrl = sitemapMatch[1];
              const sitemapFeeds = await checkSitemapForFeeds(sitemapUrl);
              for (const feed of sitemapFeeds) {
                  if (!foundFeeds.includes(feed)) {
                      foundFeeds.push(feed);
                  }
              }
          }
      }
  }
  catch (error)
  {
      console.error('ERROR querying robots.txt:', error.message);
  }


  // checkHintTable
  tools.cLog('feedSniffer: checking the hint table for', baseUrl);
  for (const elem of globalThis.prefs.rssHintTable)
  {
    const elemURL = elem.url.replace(/\/$/, '');
    if (baseUrl === elemURL)
    {
      foundFeeds.push(elem.feedUrl);
      break;
    }
  }


  // FIXME: Überprüfung der JSON Feeds - not yet supported
  // also: add sitemap-as-feed option
  // const jsonFeeds = await checkJsonFeeds(baseUrl);
  // for (const feed of jsonFeeds) {
  //     if (!foundFeeds.includes(feed)) {
  //         foundFeeds.push(feed);
  //     }
  // }

  return foundFeeds;
};


// Funktion zur Generierung von Feed-URLs basierend auf den gängigen Strukturen
function generateFeedUrls(baseUrl)
{
  return [
      `${baseUrl}/rss`,
      `${baseUrl}/feed`,
      `${baseUrl}/rss.xml`,
      `${baseUrl}/feed.xml`,
      `${baseUrl}/atom.xml`,
      `${baseUrl}/rss2.xml`,
      `${baseUrl}/rss/feed`,
      `${baseUrl}/feed/rss`,
      `${baseUrl}/atom/feed`,
      `${baseUrl}/blog/feed`,
      `${baseUrl}/news/rss`,
      `${baseUrl}/articles/rss`,
      `${baseUrl}/latest`,
      `${baseUrl}/posts`,
      `${baseUrl}/news`
  ];
};

// Funktion zum Testen einer Feed-URL und sicherstellen, dass es sich um einen RSS-Feed handelt
async function testFeedUrl(url)
{
  try
  {
      const response = await tools.rFetchUrl(url);
      if (!response.ok) return false;

      const contentType = response.headers.get('content-type');
      if (!contentType.includes('xml') && !contentType.includes('rss') && !contentType.includes('atom'))
      {
        return false;
      }

      const text = await response.text();

      return text.includes('<rss') || text.includes('<feed') || text.includes('<channel');
  }
  catch (error)
  {
      return false;
  }
};

// Funktion zur Überprüfung von Sitemap-Links
async function checkSitemapForFeeds (sitemapUrl)
{
  try
  {
      const response = await tools.rFetchUrl(sitemapUrl);
      if (response.ok)
      {
          const sitemapText = await response.text();
          const sitemapDom = new JSDOM(sitemapText);
          const sitemapDocument = sitemapDom.window.document;
          const sitemapLinks = sitemapDocument.querySelectorAll('urlset url loc');
          const foundFeeds = [];
          for (const link of sitemapLinks)
          {
              const href = link.textContent.trim();
              if (await testFeedUrl(href)) {
                  foundFeeds.push(href);
              }
          }
          return foundFeeds;
      }
  }
  catch (error)
  {
      console.error('Fehler beim Überprüfen der Sitemap:', error.message);
  }
  return [];
};

// Funktion zur Überprüfung der JSON Feed-URLs
async function checkJsonFeeds(baseUrl)
{
  const jsonFeedUrls = [
      `${baseUrl}/feed.json`,
      `${baseUrl}/json-feed`,
      `${baseUrl}/feed.jsonld`
  ];

  const foundFeeds = [];
  for (const url of jsonFeedUrls) {
      if (await testFeedUrl(url)) {
          foundFeeds.push(url);
      }
  }
  return foundFeeds;
};