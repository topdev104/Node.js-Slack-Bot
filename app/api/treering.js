const axios = require('axios');
const crypto = require('crypto');
const workspace = require('../models/workspace');
const channel = require('../slack/util/channel');
const url = require('url');

axios.interceptors.response.use(response => response, error => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
        channel.getWorkspaceId().then((data) => {
            let workspaceId = data.team.id;
            let serverHost = url.parse(error.config.url).hostname;
            let serverProtocol = url.parse(error.config.url).protocol;
            let serverUrl = serverProtocol + "//" + serverHost;

            return refreshToken(workspaceId, serverUrl).then((data) => {
                error.config.headers['Authorization'] = data;
                error.config.baseURL = undefined;
                return axios.request(error.config);
            });

        }).catch((err) => {
            console.log(err);
        });
    }

    return Promise.reject(error);
});

function getToken(workspaceId, serverUrl) {
    return new Promise((resolve,reject) => {
        let password = "";

        try {
            let base64Data = Buffer.from(workspaceId).toString('base64');
            password = crypto.createHash('md5').update(base64Data + workspaceId + base64Data + base64Data).digest('hex');
        } catch (error) {
            console.log(error);
        }

        let url = serverUrl + "/" +  API_AUTHENTICATE;

        axios.post(url,{
            deviceId: workspaceId,
            password: password
        })
            .then(response => {
                resolve(response.data.auth_token);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function refreshToken(workspaceId, serverUrl) {
    return new Promise((resolve,reject) => {
        let password = "";

        try {
            let base64Data = Buffer.from(workspaceId).toString('base64');
            password = crypto.createHash('md5').update(base64Data + workspaceId + base64Data + base64Data).digest('hex');
        } catch (error) {
            console.log(error);
        }

        let url = serverUrl + "/" +  API_AUTHENTICATE;

        axios.post(url,{
            deviceId: workspaceId,
            password: password
        })
            .then(response => {
                let token = "bearer " + response.data.auth_token;
                workspace.addToken(workspaceId, token);
                resolve(token);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function validateEmployee(workspaceInfo, cardId, pin) {

    return new Promise((resolve,reject) => {
        if (pin === undefined) pin = "";

        let url = workspaceInfo.serverUrl + "/" +  API_VALIDATE_EMPLOYEE + "?" + AF_CARD_ID + "=" + cardId + "&" + AF_PIN + "=" + pin;

        axios.get(url,{ headers: {"Authorization" : workspaceInfo.token} })
            .then(response => {
                resolve(response.data);
            }).catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function postPunch(serverUrl, token, punchInfo) {

    return new Promise((resolve, reject) => {
        let url = serverUrl + "/" +  API_PUNCH;

        axios.post(url, punchInfo,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(true);
            }).catch(error => {
            console.log(error);
            reject(error);
        });
    });
}

function postPTO(serverUrl, token, ptoInfo) {

    return new Promise((resolve, reject) => {
        let url = serverUrl + "/" +  API_PTO_REQUEST;

        axios.post(url, ptoInfo,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(true);
            }).catch(error => {
            console.log(error);
            reject(error);
        });
    });
}


function getPTOBanks(serverUrl, cardId, token) {
    return new Promise((resolve,reject) => {
        let url = serverUrl + "/" +  API_PTO_BANKS + "?" + AF_CARD_ID + "=" + cardId;

        axios.get(url,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function getAllPTO(serverUrl, cardId, token) {
    return new Promise((resolve,reject) => {
        let url = serverUrl + "/" +  API_PTO_REQUEST + "?" + AF_CARD_ID + "=" + cardId;

        axios.get(url,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function deletePTO(serverUrl, ptoId, token) {
    return new Promise((resolve,reject) => {
        let url = serverUrl + "/" +  API_PTO_REQUEST + "?" + PTO_REQUEST_ID + "=" + ptoId;

        axios.delete(url,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(true);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function getWorkspaceConfig(serverUrl, token) {
    return new Promise((resolve,reject) => {
        let url = serverUrl + "/" +  API_CONFIGURATION;

        axios.get(url,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function getLevels(serverUrl, token) {
    return new Promise((resolve,reject) => {
        let url = serverUrl + "/" +  API_GET_LEVELS;

        axios.get(url,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function getLevelHierarchyPlans(serverUrl, token) {
    return new Promise((resolve,reject) => {
        let url = serverUrl + "/" +  API_GET_LEVEL_HIERARCHY_PLANS;

        axios.get(url,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

function getQuestions(serverUrl, cardId, token) {
    return new Promise((resolve,reject) => {
        let url = serverUrl + "/" +  API_GET_QUESTION + "?" + AF_CARD_ID + "=" + cardId;

        axios.get(url,{ headers: {"Authorization" : token} })
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

module.exports = {getToken,
                    validateEmployee,
                    getWorkspaceConfig,
                    getLevels,
                    getLevelHierarchyPlans,
                    postPunch,
                    getQuestions,
                    getAllPTO,
                    getPTOBanks,
                    postPTO,
                    deletePTO};