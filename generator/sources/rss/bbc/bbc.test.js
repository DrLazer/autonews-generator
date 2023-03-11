const { scrape } = require('./bbc');

test('scrape', async () => {
  const event = {
    Records: [{
      body: JSON.stringify({
        link: {
          S: 'https://www.bbc.co.uk/news/uk-64919261',
        }
      })
    }]
  };
  const article = await scrape(event);
  console.log(article);
  expect(article).not.toBe(null);
  expect(article.length).not.toBe(0);
});