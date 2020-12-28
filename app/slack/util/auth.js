const workspace = require('../../models/workspace');
const channel = require('./channel');
const token = require('../../models/token');
const configuration = require('../../models/configuration');
const user = require('../../models/user');
const treering = require('../../api/treering');

function checkAllInfoForPunch(workspaceId, userId) {
    return new Promise((resolve,reject) => {

        checkWorkspace(workspaceId).then((serverInfo) => {

            checkToken(workspaceId, serverInfo).then((tokenInfo) => {

                checkConfig(workspaceId).then((config) => {

                    checkUser(userId).then((userData) => {
                        resolve({
                            workspaceId: workspaceId,
                            userId: userId,
                            serverInfo: serverInfo,
                            token: tokenInfo,
                            configInfo: config,
                            userInfo: userData
                        });
                    }).catch ((error) => {
                        console.log(error);
                        reject(ERROR_USER);
                    });

                }).catch((error) => {
                    console.log(error);
                    reject(ERROR_CONFIG);
                });

            }).catch((error) => {
                console.log(error);
                reject(ERROR_TOKEN);
            });

        }).catch((error) => {
            console.log(error);
            reject(ERROR_WORKSPACE);
        });

    });
}

function checkWorkspace(workspaceId) {
    return new Promise((resolve,reject) => {

        let workspaceInfo = workspace.getWorkspaceFromMemory(workspaceId);

        if (!workspaceInfo) {
            workspace.getWorkspaceFromDB(workspaceId).then((data) => {
                resolve(data.serverUrl);
            }).catch((err) => {
                reject(err);
            });
        } else {
            resolve(workspaceInfo.serverUrl);
        }
    });
}

function getBotToken(workspaceId, web, channelId) {
    return new Promise((resolve,reject) => {

        let botToken = token.getTokenFromMemory(workspaceId);

        if (!botToken) {
            token.getTokenFromDB(workspaceId).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            });
        } else {
            resolve(botToken);
        }
    });
}

function checkConfig(workspaceId) {
    return new Promise((resolve,reject) => {

        let config = configuration.getConfigValueFromMemory(workspaceId);

        if (!config) {

            configuration.getConfigFromDB(workspaceId).then((data) => {
                resolve(data);

            }).catch((err) => {

                let workspaceInfo = workspace.getWorkspaceFromMemory(workspaceId);
                if (workspaceInfo === undefined) reject(err);

                treering.getWorkspaceConfig(workspaceInfo.serverUrl, workspaceInfo.token).then((data) => {
                    configuration.addConfigToDB(workspaceId, data);
                    resolve(data);
                }).catch((err) => {
                    reject(err);
                });

            });

        } else {
            resolve(config);
        }
    });
}

function checkToken(workspaceId, serverUrl) {
    return new Promise((resolve,reject) => {

        let workspaceInfo = workspace.getWorkspaceFromMemory(workspaceId);

        if (workspaceInfo.token === undefined) {

            treering.getToken(workspaceId, serverUrl).then((tokenInfo) => {
                let token = "bearer "+ tokenInfo;
                workspace.addToken(workspaceId, token);
                resolve(token);

            }).catch((error) => {
                console.log(error);
                reject(error);
            });

        } else {
            resolve(workspaceInfo.token);
        }
    });
}

function checkUser(userId) {
    return new Promise((resolve,reject) => {

        let userInfo = user.getUserFromMemory(userId);

        if (!userInfo) {
            user.getUserFromDB(userId).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            });
        } else {
            resolve(userInfo);
        }
    });
}

module.exports = {checkAllInfoForPunch, checkWorkspace, checkConfig, checkUser, getBotToken};