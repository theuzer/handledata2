const sql = require('mssql');

const dataConnection = require('../database/azureDb').dataConnection;
const errorController = require('./errorController');

const azureDateBuilder = (year, month, day, hour, minute, second) => `${year}-${month}-${day} ${hour}:${minute}:${second}`;
const dateBuilder = date => azureDateBuilder(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
const boolBuilder = bool => bool ? 1 : 0;

const insertChar = (teamNo, playerCode, teamCode, championCode, attach, mount, outfit, emote, br1, br2, br3, br4, br5, champLevel, champTime, totalTime, division, divisionRating, league, abilityUses, damageDone, damageReceived, deaths, disablesDone, disablesReceived, energyGained, energyUsed, healingDone, healingReceived, kills, score, timeAlive) => `EXECUTE InsertCharacter @gameTeamId = @team${teamNo}Id, @playerCode = '${playerCode}', @teamCode = '${teamCode}', @championCode = ${championCode}, @attachmentCode = ${attach}, @emoteCode = ${emote}, @mountCode = ${mount}, @outfitCode = ${outfit}, @br1 = ${br1}, @br2 = ${br2}, @br3 = ${br3}, @br4 = ${br4}, @br5 = ${br5}, @championLevel = ${champLevel}, @championTimePlayed = ${champTime}, @totalTimePlayed = ${totalTime}, @division = ${division}, @divisionRating = ${divisionRating}, @league = ${league}, @abilityUses = ${abilityUses}, @damageDone = ${damageDone}, @damageReceived = ${damageReceived}, @deaths = ${deaths}, @disablesDone = ${disablesDone}, @disablesReceived = ${disablesReceived}, @energyGained = ${energyGained}, @energyUsed = ${energyUsed}, @healingDone = ${healingDone}, @healingReceived = ${healingReceived}, @kills = ${kills}, @score = ${score}, @timeAlive = ${timeAlive};`;
const insertMatch = (matchId, map, region, gameType, patch, isRanked, teamSize, date, numberOfRounds) => `EXEC @matchId = InsertMatch '${matchId}', '${map}', '${region}', '${gameType}', '${patch}', ${isRanked}, ${teamSize}, '${date}', ${numberOfRounds};`;
const insertTeam = (teamNo, teamNumber, isWin) => `EXECUTE @team${teamNo}Id = InsertTeam @matchId, ${teamNumber}, ${isWin};`;

const insertTelemetry = (match) => {
  let query = insertMatch(match.matchId, match.mapId, match.region, match.type, match.patch, boolBuilder(match.isRanked), match.teamSize, dateBuilder(match.date), match.numberOfRounds);
  query += insertTeam(1, match.team1.teamNo, boolBuilder(match.team1.win));
  query += insertTeam(2, match.team2.teamNo, boolBuilder(match.team2.win));
  match.team1.characters.forEach((c) => {
    c.talents.sort((a, b) => a - b);
    query += insertChar(1, c.playerId, c.teamId, c.character, c.attachment, c.mount, c.outfit, c.emote, c.talents[0], c.talents[1], c.talents[2], c.talents[3], c.talents[4], c.characterLevel, c.characterTimePlayed, c.totalTimePlayed, c.division, c.divisionRating, c.league, c.abilityUses, c.damageDone, c.damageReceived, c.deaths, c.disablesDone, c.disablesReceived, c.energyGained, c.energyUsed, c.healingDone, c.healingReceived, c.kills, c.score, c.timeAlive);
  });
  match.team2.characters.forEach((c) => {
    c.talents.sort((a, b) => a - b);
    query += insertChar(2, c.playerId, c.teamId, c.character, c.attachment, c.mount, c.outfit, c.emote, c.talents[0], c.talents[1], c.talents[2], c.talents[3], c.talents[4], c.characterLevel, c.characterTimePlayed, c.totalTimePlayed, c.division, c.divisionRating, c.league, c.abilityUses, c.damageDone, c.damageReceived, c.deaths, c.disablesDone, c.disablesReceived, c.energyGained, c.energyUsed, c.healingDone, c.healingReceived, c.kills, c.score, c.timeAlive);
  });
  return query;
};

const getInsertTelemetriesQuery = (matches) => {
  let query = "BEGIN TRANSACTION \n declare @matchId int;declare @team1Id int;declare @team2Id int;";
  matches.forEach((match) => {
    query += insertTelemetry(match);
  });
  query += "\n COMMIT TRANSACTION";
  return query;
};

const insertError = (query2) => {
  const query = `INSERT INTO ERROR (Query) VALUES ('${query2}');`;
  new sql.Request(dataConnection).query(query)
    .catch((err) => {
      console.log(err);
    });
};

const doQuery = (query, query2) => {
  new sql.Request(dataConnection).query(query)
    .then(() => {
      console.log('inserted 20');
    })
    .catch((err) => {
      if (err.code === 'EREQUEST') {
        insertError(query2);
      }
    });
};

exports.insertTelemetries = (matches, query2) => {
  const query = getInsertTelemetriesQuery(matches);

  doQuery(query, query2);

  let numberOfRetries = 100;
  let attemptToSave;
  let errorMessage;
  let isRunning = false;

  dataConnection.on('error', (err) => {
    if (!isRunning) {
      isRunning = true;
      if (err.code === 'ETIMEOUT') {
        if (numberOfRetries > 0) {
          attemptToSave = (100 - numberOfRetries) + 1;
          errorMessage = `timeout saving games. attempt ${attemptToSave}`;
          errorController.createErrorMongo(errorMessage, attemptToSave);
          setTimeout(() => {
            numberOfRetries -= 1;
            isRunning = false;
            doQuery(query, query2);
          }, 45000);
        } else {
          // notLoggedGameController.createNotLoggedGames(games);
        }
      }
    }
  });
};
