const auth = require('../slack/util/auth');
const events = require('events');
const channel = require('../slack/util/channel');
const workspace = require('../models/workspace');
const treering = require('../api/treering');
const util = require('../common/util');

/*
 *  Process for Punch IN
 */

//Create punch in Request.
exports.start = function(web, channelId, info) {

    /*if (info.configInfo.enforceLevelHierarchyPlan === true) {
        this.selectLevelHierarchyPlans(web, info.workspaceId, channelId, info.userInfo);
    } else {
        this.selectRequiredLevel(web, info.workspaceId, channelId, info.userId, info.configInfo.requiredLevels);
    }*/
    this.selectRequiredLevel(web, info.workspaceId, channelId, info.userId, info.configInfo.requiredLevels);
};

exports.selectRequiredLevel = function(web, workspaceId, channelId, userId, requiredLevels) {
    let selectedLevelCodes = getSelectedLevelCodes(requiredLevels);
    if (selectedLevelCodes == null) {
        selectedLevelCodes = [];
        this.postPunchIn(web, workspaceId, channelId, userId, null, selectedLevelCodes);
        return;
    }

    let hasAllDefaultValue = this.hasAllLevelDefaultValue(selectedLevelCodes);
    if (!hasAllDefaultValue) {
        this.prepareLevelCode(web, workspaceId, channelId, selectedLevelCodes, null);
    } else {
        this.postPunchIn(web, workspaceId, channelId, userId, null, selectedLevelCodes);
    }
};

exports.prepareLevelCode = function (web, workspaceId, channelId, selectedLevelCodes, timeStamp) {
    this.checkLevel(workspaceId).then((level) => {

        let emptyLevelInfo = getLevelInfoForEmptyDefaultCode(selectedLevelCodes);
        if (emptyLevelInfo == null) {
            showErrorMessage(web, channelId);
            return;
        }

        let currentSelectedLevelIndex = emptyLevelInfo.index;
        let currentSelectedLevelId = emptyLevelInfo.levelId;
        let levelCodes = getLevelCodesForLevelId(level, currentSelectedLevelId);

        let levelInfo = {
            currentSelectedLevelIndex: currentSelectedLevelIndex,
            selectedLevelCodes: selectedLevelCodes,
        };

        let message = this.getRequiredLevelMenuMessage(levelCodes, selectedLevelCodes, levelInfo);
        if (timeStamp != null) {
            channel.updateBlockMessage(web, channelId, message, timeStamp);
        } else {
            channel.sendBlockMessage(web, channelId, message);
        }

    }).catch(error => {
        console.log(error);
    });
};

exports.selectLevelHierarchyPlans = function (web, workspaceId, channelId, userInfo) {
    this.checkLevel(workspaceId).then((level) => {
        this.checkLevelHierarchyPlans(workspaceId).then((levelHierarchyPlans) => {
            let levelHierarchyPlanId = userInfo.levelHierarchyPlanId;

            if (levelHierarchyPlanId !== 0 && levelHierarchyPlans.length > 0 ) {

                let levelHierarchyPlanIndexForUser = this.getLevelHierarchyPlanIdForUser(levelHierarchyPlans, levelHierarchyPlanId);
                let nodeInfo = {
                    levelPlanIndex: levelHierarchyPlanIndexForUser,
                    selectedLevelCode: [],
                    rootLevelId: levelHierarchyPlans[levelHierarchyPlanIndexForUser].rootLevelId,
                    currentLevelId: level[0].levelId
                };

                channel.sendBlockMessage(web, channelId, this.getLevelHierarchyMenuMessage(level, levelHierarchyPlans, nodeInfo));

            }
        }).catch(error => {

        });
    }).catch(error => {

    });
};

exports.postPunchIn = function(web, workspaceId, channelId, userId, timestamp, selectedLevels) {

    auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {

        let punchInfo = util.preparePunchInfo(info.userInfo.cardId, IN, null, null, selectedLevels, -1);

        treering.postPunch(info.serverInfo, info.token, punchInfo).then((isSuccess) => {
            let message = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "You've punched in successfully. To punch out type `out`."
                    }
                }
            ];

            if (timestamp != null) {
                channel.updateBlockMessage(web, channelId, message, timestamp);
            } else {
                channel.sendBlockMessage(web, channelId, message);
            }

        }).catch ((error) => {
            console.log(error);
            channel.updateMessage(web, channelId, "Punch In Error!", timestamp);
        });

    }).catch((error) => {
        console.log(error);
        events.showLoginMessage(web, channelId);
    });
};

exports.getLevelHierarchyPlanIdForUser = function(levelHierarchyPlan, levelHierarchyId) {
    for (let i = 0; i < levelHierarchyPlan.length; i++) {
        if (levelHierarchyPlan[i].levelHierarchyPlanId === levelHierarchyId) {
            return i;
        }
    }

    return -1;
};

exports.checkLevel = function (workspaceId) {
    return new Promise((resolve, reject) => {

        let level = workspace.getLevel(workspaceId);

        if (level === undefined) {
            let workspaceInfo = workspace.getWorkspaceFromMemory(workspaceId);

            if (workspaceInfo === undefined) return;

            let serverUrl = workspaceInfo.serverUrl;
            let token = workspaceInfo.token;

            treering.getLevels(serverUrl, token).then((level) => {
                workspace.setLevel(workspaceId, level);
                resolve(level);
            }).catch(error => {
                reject(error);
            });

        } else {
            resolve(level);
        }

    });
};

exports.checkLevelHierarchyPlans = function (workspaceId) {
    return new Promise((resolve, reject) => {

        let levelHierarchyPlan = workspace.getLevelHierarchyPlan(workspaceId);

        if (levelHierarchyPlan === undefined) {
            let workspaceInfo = workspace.getWorkspaceFromMemory(workspaceId);

            if (workspaceInfo === undefined) return;

            let serverUrl = workspaceInfo.serverUrl;
            let token = workspaceInfo.token;

            treering.getLevelHierarchyPlans(serverUrl, token).then((levelHierarchPlans) => {
                workspace.setLevelHierarchyPlan(workspaceId, levelHierarchPlans);
                resolve(levelHierarchPlans);
            }).catch(error => {
                reject(error);
            });

        } else {
            resolve(levelHierarchyPlan);
        }

    });
};

exports.getRequiredLevelMenuMessage = function (levelCodes, selectedLevelCodes, levelInfo) {
    let options = [];

    for (let i = 0; i < levelCodes.length; i++){
        options.push({
            text: {
                type: "plain_text",
                text: levelCodes[i].description
            },
            value: levelCodes[i].code.toString()
        });
    }

    let initialOption = {
        text: {
            type: "plain_text",
            text: levelCodes[0].description
        },
        value: levelCodes[0].code.toString()
    };

    return [
        {
            "type": "actions",
            "block_id": JSON.stringify(levelInfo),
            "elements": [
                {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select...",
                        "emoji": true
                    },
                    "action_id": "required_level_select",
                    "options": options,
                    "initial_option": initialOption
                }
            ]
        }
    ];
};

exports.getLevelHierarchyMenuMessage = function (levels, levelHierarchyPlans, nodeInfo) {
    let options = [];

    let selectedLevels = nodeInfo.selectedLevelCode;
    let rootLevelId = nodeInfo.rootLevelId;
    let nodes = getNodes(levelHierarchyPlans, nodeInfo);

    let currentLevelDepth = 0;

    if (selectedLevels === undefined || selectedLevels.length === 0) {
        currentLevelDepth = 0;
    } else {
        currentLevelDepth = selectedLevels.length;
    }

    let levelId = levels[currentLevelDepth].levelId;
    let initialOption = undefined;

    if (levelId < rootLevelId || nodes.length === 0) {

        for (let i = 0; i < levels[currentLevelDepth].levelCodes.length; i++){
            options.push({
                text: {
                    type: "plain_text",
                    text: levels[currentLevelDepth].levelCodes[i].description
                },
                value: levels[currentLevelDepth].levelCodes[i].code
            });
        }

        initialOption = {
            text: {
                type: "plain_text",
                text: levels[currentLevelDepth].levelCodes[0].description
            },
            value: levels[currentLevelDepth].levelCodes[0].code
        }

    } else {

        for (let i = 0; i < nodes.length; i++){
            options.push({
                text: {
                    type: "plain_text",
                    text: nodes[i].description
                },
                value: nodes[i].levelCode
            });
        }

        initialOption = {
            text: {
                type: "plain_text",
                text: nodes[0].description
            },
            value: nodes[0].levelCode
        }
    }

    return [
        {
            "type": "actions",
            "block_id": JSON.stringify(nodeInfo),
            "elements": [
                {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select...",
                        "emoji": true
                    },
                    "action_id": "hierarchy_select",
                    "options": options,
                    "initial_option": initialOption
                }
            ]
        }
    ];
};

function getNodes(levelHierarchyPlans, nodeInfo) {
    let selectedLevels = nodeInfo.selectedLevelCode;
    let rootLevelId = nodeInfo.rootLevelId;
    let levelPlanIndex = nodeInfo.levelPlanIndex;
    let currentLevelId = nodeInfo.currentLevelId;

    let nodes = levelHierarchyPlans[levelPlanIndex].levelNodes;

    if (selectedLevels.length === 0) {
       if (currentLevelId === rootLevelId) {
           return nodes;
       } else {
           return [];
       }
    }

    if (currentLevelId < rootLevelId) return [];

    for (let i = 0; i < selectedLevels.length; i ++) {
        let selectedLevelCode = selectedLevels[i].levelCode;

        for (let j = 0; j < nodes.length; j ++) {
            if (nodes[j].levelCode === selectedLevelCode) {
                nodes = nodes[j].levelNodes;
                break;
            }
        }

        if (nodes.length === 0) return nodes;
    }

    return nodes;
}

function getSelectedLevelCodes(requiredLevels) {
    let selectedLevels = [];

    if (requiredLevels == null || requiredLevels.length === 0) return null;

    for (let i = 0; i < requiredLevels.length; i++) {
        selectedLevels.push({
            levelId: requiredLevels[i].levelId,
            levelCode: requiredLevels[i].defaultLevelCode
        });
    }

    return selectedLevels;
}

function getLevelInfoForEmptyDefaultCode(selectedLevelCodes) {
    for (let i = 0; i < selectedLevelCodes.length; i++) {
        if (selectedLevelCodes[i].levelCode === "") {
            return {
                index: i,
                levelId: selectedLevelCodes[i].levelId
            };
        }
    }

    return null;
}

function getLevelCodesForLevelId(levels, levelId) {
    for (let i = 0; i < levels.length; i++) {
        if (levels[i].levelId === levelId) return levels[i].levelCodes;
    }

    return null;
}

function showErrorMessage(web, channelId) {
    channel.sendBlockMessage(web, channelId, "Required Levels are empty or invalid. Please ask server manager to check this issue.");
}

exports.hasAllLevelDefaultValue = function(selectedLevelCodes) {
    for (let i = 0; i < selectedLevelCodes.length; i++) {
        if (selectedLevelCodes[i].levelCode === "") {
            return false;
        }
    }

    return true;
};

exports.getCodeMenuMessage = function (levelCodes, selectedLevelId) {
    let options = [];

    for (let i = 0; i < levelCodes.length; i++){
        options.push({
            text: {
                type: "plain_text",
                text: levelCodes[i].description
            },
            value: levelCodes[i].code
        });
    }

    let initialOption = {
        text: {
            type: "plain_text",
            text: levelCodes[0].description
        },
        value: levelCodes[0].code
    };

    return [
        {
            "type": "actions",
            "block_id": selectedLevelId,
            "elements": [
                {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select Code",
                        "emoji": true
                    },
                    "action_id": "code_select",
                    "options": options,
                    "initial_option": initialOption
                }
            ]
        }
    ];
};

exports.getCodesForSelectedLevel = function (selectedLevelId, level) {

    for (let i = 0; i < level.length; i++){
       if (selectedLevelId === level[i].levelId.toString()) {
           return level[i].levelCodes;
       }
    }

    return null;
};

exports.getNodesForSelectedCode = function (nodes, selectedCode) {
    for (let i = 0; i < nodes.length; i++){
        if (selectedCode === nodes[i].levelCode) {
            return nodes.levelNodes;
        }
    }

    return [];
};
