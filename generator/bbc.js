'use strict';

const AWS = require('aws-sdk');
const parseString = require('xml2js').parseString;
const cheerio = require('cheerio');

const scrapeArticle = async (url) => {
  console.log(`[bbc]: loading url for scraping ${url}`);
  let html ='';
  try {
    const response = await fetch(url);
    html = await response.text();
  } catch (error) {
    console.log(`[bbc]: error loeading url for scraping ${url}`);
    console.log(error);
    return;
  }

  console.log(`[bbc]: loading html into cheerio`);
  const $ = cheerio.load(html);
  const textBlocks = []

  console.log(`[bbc]: extracting 'text-block' instances`);
  $('[data-component="text-block"]').each((i, element) => {
    textBlocks.push($(element).text());
  });

  return textBlocks;
}

module.exports.ingestrss = async (event) => {
  console.log(`[bbc]: getting latest rss feed`);
  let xmlDoc = '';
  const rssItems = [];
  try {
    const response = await fetch('http://feeds.bbci.co.uk/news/rss.xml');
    xmlDoc = await response.text();
    console.log(`[bbc]: parsing rss feed`);
    
    parseString(xmlDoc, function (err, result) {
      const items = result?.rss?.channel[0]?.item;
      items.forEach(async (item) => {
        const rssItem = {
          title: item?.title[0],
          link: item?.link[0],
          pubDate: item.pubDate[0],
          description: item.description[0],
        }
        rssItems.push(rssItem);
      });
    });
  } catch (error) {
    console.log(`[bbc]: error getting latest rss feed`);
    console.log(error);
    return {
      statusCode: 500,
      body: err.message,
    };
  }

  return {
    statusCode: 200,
    body: rssItems
  };
};