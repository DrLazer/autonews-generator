'use strict';

const parseString = require('xml2js').parseString;
const cheerio = require('cheerio');
const BucketName = process.env.SOURCE_BUCKET
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const client = new S3Client();

const scrapeArticle = async (url) => {
  console.log(`[bbc]: loading url for scraping ${url}`);
  let html ='';
  try {
    const response = await fetch(url);
    html = await response.text();
  } catch (error) {
    console.log(`[bbc]: error loading url for scraping ${url}`);
    console.log(error);
    return;
  }

  console.log(`[bbc]: loading html into cheerio`);
  const $ = cheerio.load(html);
  let article = '';
  
  console.log(`[bbc]: extracting 'main-heading' instance`);
  const headingText = $('#main-heading').text();
  console.log(`[bbc]: main-heading is ${headingText}`);
  article = article + `<h1>${headingText}</h1>`;

  console.log(`[bbc]: extracting 'text-block' instances`);
  $('[data-component="text-block"]').each((i, element) => {
    article = article + `<p>${$(element).text()}</p>`;
  });

  return article;
}

const writeToS3SourceBucket = async (id, article) => {
  console.log('[bbc]: writing article to s3.');

  const command = new PutObjectCommand({
    Bucket: BucketName,
    Key: `${id}.json`,
    Body: JSON.stringify(article)
  });

  console.log('[bbc]: beginning s3 upload');
  try {
    const response = await client.send(command);
    console.log('[bbc]: upload to s3 succesful');
  } catch (err) {
    console.log('[bbc]: error uploading to s3');
    console.log(err);
  }
}

module.exports.scrape = async (event) => {
  if (!event?.Records) {
    console.log('[bbc]: Event needs to be SQS message');
    return;
  }
  console.log(`[bbc]: scraping article from scrape queue`);
  for (let i in event.Records) {
    let record = event.Records[i];
    let message = JSON.parse(record.body);
    const article = await scrapeArticle(message.link.S);
    await writeToS3SourceBucket(message.Id.S, article);
  }
};

module.exports.getMeta = async (event) => {
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
          link: item?.guid[0]?._,
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