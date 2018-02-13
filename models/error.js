const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const HandlerErrorSchema = new Schema({
  date_created: { type: Date, default: Date.now },
  errorMessage: String,
  attemptToSave: Number,
});

module.exports = mongoose.model('HandlerError', HandlerErrorSchema);

