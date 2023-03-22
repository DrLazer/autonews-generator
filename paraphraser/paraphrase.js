const AWS = require('aws-sdk');
const { DateTime } = require("luxon");
const { Configuration, OpenAIApi } = require("openai");

const s3 = new AWS.S3();
const db = new AWS.DynamoDB.DocumentClient();
const singleTableName = process.env.DYNAMO_SINGLE_TABLE;

const AUTHOR = "Daniel O'Daniela";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports.go = async (event) => {
  try {
    for (const record of event.Records) {
      // Get the S3 object key from the event record
      const key = record.s3.object.key;

      // Get the JSON file contents from S3
      const params = {
        Bucket: record.s3.bucket.name,
        Key: key
      };
      const obj = await s3.getObject(params).promise();

      // Parse the JSON file contents
      const article = {
        original: JSON.parse(obj.Body.toString()),
      };

      // Select the source meta from dynamo
      console.log(`selecting article ${key.replace('.json','')}`);
      const dynamoSourceParams = {
        TableName: singleTableName,
        KeyConditionExpression: '#Pk = :pk and #Sk = :sk',
        ExpressionAttributeNames: {
          '#Pk': 'Pk',
          '#Sk': 'Sk',
        },
        ExpressionAttributeValues: {
          ":pk": 'source-article',
          ":sk": key.replace('.json',''),
        },
      };
      const queriedItems = await db.query(dynamoSourceParams).promise();
      if (!queriedItems.Items) {
        throw new Error(`No article with sk ${key.replace('.json','')}`);
      };

      console.log('source meta');
      console.log(queriedItems.Items[0]);

      console.log("Original article to rewrite: ", article);

      // Rewrite the article with the OpenAI API
      const prompt = `Please rewrite the following article, 
      ensuring that none of the original sentences are used but maintaining the same topic and meaning. 
      Also generate me a heading, a one sentance short description with no html tags, 
      and categorise the article into one of the following: 
      news, sport, climate, UK, world, business, politics, technology, science, health, family, education. 
      Remove all references to the original author, but keep the HTML tags intact. 
      Do not include any new line '\n' tags in your response. 
      Return the output as a valid JSON object with the following keys: headline, description, category, article. 
      : ${article.original}`;
      const conversation = [{
        role: 'system',
        content: prompt
      }];
      const gptResponseObject = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        messages: conversation,
      });

      let gptResponse = gptResponseObject?.data?.choices[0]?.message?.content;
      console.log('GPT response');
      console.log(gptResponse);

      gptResponse = JSON.parse(gptResponse);

      // Write the JSON contents to the serve S3 bucket
      const putParams = {
        Bucket: process.env.SERVE_BUCKET,
        Key: key,
        Body: gptResponse.article,
        ContentType: 'application/json'
      };
      const res = await s3.putObject(putParams).promise();
      console.log('Successfully added article to serve bucket: ', res);

      // Write the serve meta
      console.log('Writing the serve meta')
      const servePutParams = {
        TableName: singleTableName,
        Item: {
          'pubDate': queriedItems.Items[0].pubDate,
          'description': gptResponse?.description,
          'title': gptResponse?.headline,
          'author': AUTHOR,
          'category': gptResponse?.category,
          'Sk': key.replace('.json',''),
          'Pk': 'serve-article'
        }
      };
      console.log(servePutParams);
      try {
        const result = await db.put(servePutParams).promise();
        console.log('Record written successfully:', result);
      } catch (err) {
        console.error(err);
      }

      // Delete the original S3 object if successfully written to serve bucket
      const deleteParams = {
        Bucket: record.s3.bucket.name,
        Key: key
      };
      await s3.deleteObject(deleteParams).promise();
      console.log('Successfully deleted article from original bucket.');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}