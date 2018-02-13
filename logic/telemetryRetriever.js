const moment = require('moment');
const sql = require('mssql');
const axios = require('axios');

const logConnection = require('../database/azureDb').logConnection;
const telemetryHandler = require('./telemetryHandler');

const responseQueue = [];
const maxWorkers = 50;
let runningWorkers = 0;

const getQuery = () => {
  const date = moment().add(parseInt(process.env.PROCESS_MINUTES_LESS, 10), 'm');
  let query = "SELECT STATS FROM GAME WHERE DATEPART(YEAR, LOGDATE) = ";
  query += date.year();
  query += " AND DATEPART(MONTH, LOGDATE) = ";
  query += date.month() + 1;
  query += " AND DATEPART(DAY, LOGDATE) = ";
  query += date.date();
  query += " AND DATEPART(HOUR, LOGDATE) = ";
  query += date.hour();
  query += " AND DATEPART(MINUTE, LOGDATE) = ";
  query += date.minute();
  console.log(query);
  return query;
};

const doWork = (workerNum, query) => {
  if (responseQueue.length) {
    const url = responseQueue.shift();
    axios.get(url)
      .then((response) => {
        telemetryHandler.mapTelemetry(response.data, query);
        doWork(workerNum, query);
      })
      .catch((err) => {
        console.log(err.message);
      });
  } else {
    runningWorkers -= 1;
  }
};

const wakeWorkers = (totalWorkers, query) => {
  const workersToWake = totalWorkers - runningWorkers;
  for (let i = 0; i < workersToWake; i++) {
    runningWorkers += 1;
    doWork(i, query);
  }
};

exports.init = () => {
  const query = getQuery();
  new sql.Request(logConnection).query(query)
    .then((response) => {
      response.recordset.forEach((record) => {
        responseQueue.push(record.STATS);
      });
      wakeWorkers(maxWorkers, query);
    })
    .catch((err) => {
      console.log(err);
    });
};
