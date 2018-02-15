const HandlerError = require('../models/error');

// Mongo DB
exports.createErrorMongo = (errorMessage, attemptToSave, queueLength) => {
  const newError = new HandlerError();
  newError.errorMessage = errorMessage;
  newError.attemptToSave = attemptToSave;
  newError.queueLength = queueLength;

  newError.save((err) => {
    if (err) {
      throw err;
    }
  });
};
