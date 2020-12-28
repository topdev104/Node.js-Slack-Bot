require('../common/constant');

const level = require('level');

const db  = level(WORKSPACE_DB);

let workspaces = {};
let isAppFirstOpened = {};
let levels = {};
let levelHierarchyPlans = {};

const workspace = {
    addWorkspaceToMemory: addWorkspaceToMemory,
    getWorkspaceFromMemory: getWorkspaceFromMemory,
    addToken: addToken,
    getToken: getToken,
    getWorkspaceFromDB: getWorkspaceFromDB,
    addWorkspaceToDB: addWorkspaceToDB,
    deleteWorkspace: deleteWorkspace,
    setIsAppFirstOpened: setIsAppFirstOpened,
    getIsAppFirstOpened: getIsAppFirstOpened,
    setLevel: setLevel,
    getLevel: getLevel,
    setLevelHierarchyPlan: setLevelHierarchyPlan,
    getLevelHierarchyPlan: getLevelHierarchyPlan
};

function addWorkspaceToMemory(workspaceId, data) {
    workspaces[workspaceId] = data;
}

function getWorkspaceFromMemory(workspaceId){
    return workspaces[workspaceId];
}

function setIsAppFirstOpened(workspaceId, data) {
    isAppFirstOpened[workspaceId] = data;
}

function getIsAppFirstOpened(workspaceId){
    return isAppFirstOpened[workspaceId];
}

function addToken(workspaceId, token) {
    workspaces[workspaceId].token = token;
}

function getToken(workspaceId) {
    return workspaces[workspaceId].token;
}

function getWorkspaceFromDB(workspaceId) {
    return new Promise((resolve,reject) => {

        db.get(workspaceId, function (err, value) {

            if (err || value === undefined || value === null) {
                reject(err);

            } else {

                let workspace = {
                    serverUrl: value,
                    token: undefined,
                };

                workspaces[workspaceId] = workspace;
                resolve(workspace);

            }
        });
    });
}


function addWorkspaceToDB(workspaceId, data) {
    return new Promise((resolve,reject) => {

        db.put(workspaceId, data, function (err) {
            if (err) reject(err);

            if (workspaces[workspaceId] === undefined) {

                workspaces[workspaceId] = {
                    serverUrl: data,
                    token: undefined,
                };

            } else {
                workspaces[workspaceId].serverUrl = data
            }

            resolve(true);
        })

    });
}

function deleteWorkspace(workspaceId) {
    return new Promise((resolve,reject) => {

        db.del(workspaceId, function (err) {
            if (err) reject(err);

            workspaceId[workspaceId] = undefined;
            resolve(true);
        });

    });
}

function setLevel(workspaceId, level) {
    levels[workspaceId] = level;
}

function getLevel(workspaceId) {
    return levels[workspaceId];
}

function setLevelHierarchyPlan(workspaceId, LevelHierarchyPlan) {
    levelHierarchyPlans[workspaceId] = LevelHierarchyPlan;
}

function getLevelHierarchyPlan(workspaceId) {
    return levelHierarchyPlans[workspaceId];
}

module.exports = workspace;



