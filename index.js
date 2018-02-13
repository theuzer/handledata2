const express = require('express');
const path = require('path');
const ontime = require('ontime');
const https = require('https');

const telemetryRetriever = require('./logic/telemetryRetriever');
const logConnection = require('./database/azureDb').logConnection;
const dataConnection = require('./database/azureDb').dataConnection;
require('./database/mongoDb');

const port = process.env.PORT || 3000;

const app = express();

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server listening on port ${port}`);
  }
});

// Keep app awake in Heroku
if (process.env.HEROKU_TIMER_CREATE === 'TRUE') {
  setInterval(() => {
    https.get(process.env.HEROKU_APP_URL);
    console.log('Pinged application');
  }, parseInt(process.env.HEROKU_APP_TIMER, 10));
}

logConnection.connect().then(() => { console.log('log connection'); }).catch((err) => { console.log(0, err.code); });
dataConnection.connect().then(() => { console.log('data connection'); }).catch((err) => { console.log(1, err.code); });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
  console.log('a');
});

ontime({
  cycle: ['45'],
}, (ot) => {
  telemetryRetriever.init();
  ot.done();
});
