const mongoose = require('mongoose');

const dbURI = `mongodb://${encodeURIComponent(process.env.DB_USERNAME)}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
mongoose.connect(dbURI);
mongoose.connection.on('error', (err) => {
  if (err) {
    console.log(err);
  }
});

module.exports = mongoose;
