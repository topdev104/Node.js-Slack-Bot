const level = require('level');

const db  = level(TOKEN_DB);

let tokens = {};

const token = {
    addTokenToDB: addTokenToDB,
    getTokenFromDB: getTokenFromDB,
    getTokenFromMemory: getTokenFromMemory,
};

function getTokenFromDB(workspaceId) {
    return new Promise((resolve,reject) => {

        db.get(workspaceId, function (err, value) {

            if (err || value === undefined || value === null) {
                reject(err);

            } else {

                tokens[workspaceId] = value;
                resolve(value);

            }
        });
    });
}


function addTokenToDB(workspaceId, data) {
    return new Promise((resolve,reject) => {

        db.put(workspaceId, data, function (err) {
            if (err) reject(err);

            tokens[workspaceId] = data;
            resolve(true);
        })

    });
}

function getTokenFromMemory(workspaceId) {
    return tokens[workspaceId];
}

module.exports = token;



