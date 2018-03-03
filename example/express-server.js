const express = require('express')
const imageGenerator = require('../index');

const incomingUrl = '';

const app = express()

app.get('/', (req, res) => {
  const url = req.query.i;
  if (!url) {
    res.status(200)
    imageGenerator.getPlaceholder(res);
    return;
  }
    
  imageGenerator.generateImage({
    url,
    ...req.query,
  }, res)
    .catch((error) => {
      res.status(200);
      imageGenerator.getPlaceholder(res);
    })
});

app.listen(3000, () => console.log('Example app listening on port 3000!'))