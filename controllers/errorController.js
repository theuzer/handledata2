const HandlerError = require('../models/error');

// Mongo DB
exports.createErrorMongo = (errorMessage, attemptToSave) => {
  const newError = new HandlerError();
  newError.errorMessage = errorMessage;
  newError.attemptToSave = attemptToSave;

  newError.save((err) => {
    if (err) {
      throw err;
    }
  });
};
