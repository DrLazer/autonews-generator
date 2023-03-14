const AWS = require('aws-sdk');
const { Configuration, OpenAIApi } = require("openai");

const s3 = new AWS.S3();

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

      console.log("Original article to rewrite: ", article);

      // Rewrite the article with the OpenAI API
      const prompt = `Rewrite the following article without re-using any sentences.
      Remove any reference to the source who wrote it.
      Keep the html tags and wrap the result in a div tag.:\n\n ${article.original}`;
      const conversation = [{
        role: 'system',
        content: prompt
      }];
      const gptResponse = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        messages: conversation,
      });

      console.log("CHAT GPT RESPONSE: ", gptResponse)

      const rewrittenArticle = gptResponse?.data?.choices[0]?.message?.content;

      // Add the rewritten version of the article to the original JSON object for comparison.
      article.rewritten = rewrittenArticle;

      // Write the JSON contents to the serve S3 bucket
      const putParams = {
        Bucket: process.env.SERVE_BUCKET,
        Key: key,
        Body: JSON.stringify(article),
        ContentType: 'application/json'
      };
      await s3.putObject(putParams)
        .promise()
        .then(async (res) => {
          console.log('Successfully added article to serve bucket: ', res);

          // Delete the original S3 object if successfully written to serve bucket
          const deleteParams = {
            Bucket: record.s3.bucket.name,
            Key: key
          };
          await s3.deleteObject(deleteParams).promise();
          console.log('Successfully deleted article from original bucket.');
        })
        .catch(err => {
          console.error('Error uploading article to serve bucket ', err);
        });
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}