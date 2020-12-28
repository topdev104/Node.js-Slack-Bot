const level = require('level');

const db  = level(CONFIG_DB);

let configs = {};

const configuration = {
    addConfigToDB: addConfigToDB,
    getConfigFromDB: getConfigFromDB,
    setConfigValue: setConfigValue,
    getConfigValueFromMemory: getConfigValueFromMemory,
};

function getConfigFromDB(workspaceId) {
    return new Promise((resolve,reject) => {

        db.get(workspaceId, function (err, value) {

            if (err || value === undefined || value === null) {
                reject(err);

            } else {

                configs[workspaceId] = JSON.parse(value);
                resolve(value);

            }
        });
    });
}


function addConfigToDB(workspaceId, data) {
    return new Promise((resolve,reject) => {

        db.put(workspaceId, JSON.stringify(data), function (err) {
            if (err) reject(err);

            configs[workspaceId] = data;
            resolve(true);
        })

    });
}

function setConfigValue(workspaceId, configData) {
    configs[workspaceId] = configData;
}

function getConfigValueFromMemory(workspaceId) {
    return configs[workspaceId];
}

module.exports = configuration;



