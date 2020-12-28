const channel = require('./util/channel');
const auth = require('./util/auth');
const punchIn = require('../punch/in');
const punchOut = require('../punch/out');
const punchPto = require('../punch/pto');
const help = require('../punch/help');
const workspace = require('../models/workspace');
const user = require('../models/user');
const treering = require('../api/treering');

const handle = (slackActions, web) => {
    /*--------------------------- Action for clicking login button -----------------------------------------*/
    slackActions.action({ actionId: 'login_clicked' }, (payload, respond) => {
        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let triggerId = payload.trigger_id;
        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            auth.checkConfig(workspaceId).then((config) => {
                channel.showLoginDialog(web, config, triggerId);
            }).catch((error) => {
                console.log(error);
                channel.sendMessage(web, channelId, "We can't get your workspace configuration data.");
            });

        })();
    });

    /*--------------------------- Action for clicking tip_quantity button -----------------------------------------*/
    slackActions.action({ actionId: 'tip_quantity_clicked' }, (payload, respond) => {
        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let triggerId = payload.trigger_id;
        let timestamp = payload.message.ts;
        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            auth.checkConfig(workspaceId).then((config) => {
                punchOut.openTipAndQuantityInputDialog(web, config, triggerId, timestamp);
            }).catch((error) => {
                console.log(error);
                channel.sendMessage(web, channelId, "We can't get your workspace configuration data.");
            });

        })();

    });

    /*--------------------------------- Action for submitting dialog ---------------------------------------*/
    slackActions.action({ type: 'dialog_submission' }, (payload, respond) => {

        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let userId = payload.user.id;
        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            if (payload.callback_id === 'dialog/login/submit') {
                let cardId = payload.submission.card_id;
                let pin = payload.submission.pin;

                let workspaceInfo = workspace.getWorkspaceFromMemory(workspaceId);

                if (workspaceInfo === undefined) {
                    respond({ text: 'Error Occurred!', replace_original: true });
                    return;
                }

                treering.validateEmployee(workspaceInfo, cardId, pin).then((userData) => {
                    if (userData.cardId !== null && userData.employeeId !== 0) {
                        user.addUserToDB(userId, userData);
                        respond({ text: 'You have logged in successfully!* :simple_smile:', replace_original: true});
                    } else {
                        respond({ text: 'Invalid CardID or PIN!', replace_original: true});
                    }

                }).catch((error) => {
                    console.log(error);
                    respond({ text: 'Error Occurred!', replace_original: true });
                });

            } else if (payload.callback_id === 'dialog/out/submit') {

                auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {

                    let tip = payload.submission.tip;
                    let quantity = payload.submission.quantity;
                    let timestamp = payload.state;

                    if (info.configInfo.attestationQuestions === true) {
                        let data = {
                            tip: tip === undefined ? "" : tip,
                            quantity: quantity === undefined ? "" : quantity,
                            questions: undefined
                        };

                        user.addOutInfo(userId, data);
                        punchOut.showQuestion(info, web, channelId, timestamp);

                    } else {
                        punchOut.postPunchOut(web, workspaceId, channelId, userId, timestamp, tip === undefined ? "" : tip, quantity === undefined ? "" : quantity, "");
                    }

                }).catch((error) => {
                    console.log(error);
                });

            } else if (payload.callback_id === 'dialog/pto_hours/submit') {

                auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {

                    let hours = payload.submission.hours;
                    let ptoInfo = JSON.parse(payload.state);

                    ptoInfo.hours = hours;

                    punchPto.preparePTORequest(web, workspaceId, channelId, userId, ptoInfo);

                }).catch((error) => {
                    console.log(error);
                });

            }

        })();

    });

    /*------------------------------------- Action for department menu -------------------------------------*/
    slackActions.action({actionId: 'required_level_select'}, (payload, respond) => {

        let selectedLevelCode = payload.actions[0].selected_option.value;
        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let userId = payload.user.id;
        let timestamp = payload.message.ts;
        let levelInfo = JSON.parse(payload.actions[0].block_id);

        let selectedLevelCodes = levelInfo.selectedLevelCodes;
        let currentLevelIndex = levelInfo.currentSelectedLevelIndex;
        selectedLevelCodes[currentLevelIndex].levelCode = selectedLevelCode;

        let hasAllDefaultValue = punchIn.hasAllLevelDefaultValue(selectedLevelCodes);

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            if (hasAllDefaultValue) {
                punchIn.postPunchIn(web, workspaceId, channelId, userId, timestamp, selectedLevelCodes);
                return;
            }

            punchIn.prepareLevelCode(web, workspaceId, channelId, selectedLevelCodes, timestamp);

        })();

    });

    /*-------------------------------------- Action for code menu -------------------------------------------*/
    slackActions.action({actionId: 'code_select'}, (payload, respond) => {

        let selectedLevelId = payload.actions[0].block_id;
        let selectedCode = payload.actions[0].selected_option.value;
        let timestamp = payload.message.ts;

        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let userId = payload.user.id;

        let punchLevel = [
            {
                "levelId": selectedLevelId,
                "levelCode": selectedCode
            }];

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            punchIn.postPunchIn(web, workspaceId, channelId, userId, timestamp, punchLevel);

        })();

    });

    /*----------------------------------- Action for hierarchy menu -----------------------------------------*/
    slackActions.action({actionId: 'hierarchy_select'}, (payload, respond) => {

        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let userId = payload.user.id;
        let nodeInfo = JSON.parse(payload.actions[0].block_id);
        let selectedLevelCode = payload.actions[0].selected_option.value;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            punchIn.checkLevel(workspaceId).then((level) => {
                punchIn.checkLevelHierarchyPlans(workspaceId).then((levelHierarchyPlans) => {

                    let selectedLevels = nodeInfo.selectedLevelCode;
                    let levelPlanIndex = nodeInfo.levelPlanIndex;
                    let rootLevelId = nodeInfo.rootLevelId;
                    let currentLevelId = nodeInfo.currentLevelId;
                    let timestamp = payload.message.ts;

                    selectedLevels.push({
                        levelId: currentLevelId,
                        levelCode: selectedLevelCode
                    });

                    if (selectedLevels.length === level.length) {
                        punchIn.postPunchIn(web, workspaceId, channelId, userId, timestamp, selectedLevels);
                        return;
                    }

                    let newNodeInfo = {
                        levelPlanIndex: levelPlanIndex,
                        selectedLevelCode: selectedLevels,
                        rootLevelId: rootLevelId,
                        currentLevelId: level[selectedLevels.length].levelId
                    };

                    channel.updateBlockMessage(web, channelId, punchIn.getLevelHierarchyMenuMessage(level, levelHierarchyPlans, newNodeInfo), timestamp);

                }).catch(error => {
                    respond({ text: 'Error Occurred!', replace_original: true });
                });

            }).catch(error => {
                respond({ text: 'Error Occurred!', replace_original: true });
            });

        })();

    });

    /*-------------------------------------- Action for pto banks menu -------------------------------------------*/
    slackActions.action({actionId: 'bank_select'}, (payload, respond) => {

        let ptoInfo = JSON.parse(payload.actions[0].block_id);
        let payTypeId = payload.actions[0].selected_option.value;
        let timestamp = payload.message.ts;
        let workspaceId = payload.team.id;

        ptoInfo.payTypeId = payTypeId;
        let channelId = payload.channel.id;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            channel.updateBlockMessage(web, channelId, punchPto.getAllDayMessage(ptoInfo), timestamp);

        })();
    });

    /*-------------------------------------- Action for pto start time menu -------------------------------------------*/
    slackActions.action({actionId: 'start_time_select'}, (payload, respond) => {

        let ptoInfo = JSON.parse(payload.actions[0].block_id);
        let startTime = payload.actions[0].selected_option.value;
        let workspaceId = payload.team.id;
        let triggerId = payload.trigger_id;
        let timestamp = payload.message.ts;

        ptoInfo.startTime = startTime;
        ptoInfo.timestamp = timestamp;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            if (parseInt(ptoInfo.hours) > 0) {
                punchPto.preparePTORequest(web, payload.team.id, payload.channel.id, payload.user.id, ptoInfo);
            } else {
                punchPto.openInputHoursDialog(web, triggerId, ptoInfo);
            }

        })();

    });

    /*---------------------------------------- Question Yes Button ------------------------------------------*/
    slackActions.action({actionId: 'question_yes'}, (payload, respond) => {

        let sumQuestionValue = parseInt(payload.actions[0].block_id);
        let timestamp = payload.message.ts;
        let index = payload.actions[0].value;

        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let userId = payload.user.id;

        let outInfo = user.getOutInfo(userId);

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            if (outInfo !== undefined && outInfo.questions !== undefined && outInfo.questions.length > 0) {
                sumQuestionValue += outInfo.questions[index].questionBitValue;
                index ++;

                if (index === outInfo.questions.length) {
                    punchOut.postPunchOut(web, workspaceId, channelId, userId, timestamp, outInfo.tip, outInfo.quantity, sumQuestionValue);
                } else {
                    channel.updateBlockMessage(web, channelId, punchOut.getQuestionMessage(outInfo.questions[index], index, sumQuestionValue), timestamp);
                }

            } else {
                punchOut.postPunchOut(web, workspaceId, channelId, userId, timestamp, "", "", -1);
            }

        })();

    });

    /*---------------------------------------- Question No Button ------------------------------------------*/
    slackActions.action({actionId: 'question_no'}, (payload, respond) => {

        let sumQuestionValue = payload.actions[0].block_id;
        let timestamp = payload.message.ts;
        let index = payload.actions[0].value;

        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let userId = payload.user.id;

        let outInfo = user.getOutInfo(userId);

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            if (outInfo !== undefined && outInfo.questions !== undefined && outInfo.questions.length > 0) {
                index ++;

                if (index === outInfo.questions.length) {
                    punchOut.postPunchOut(web, workspaceId, channelId, userId, timestamp, outInfo.tip, outInfo.quantity, sumQuestionValue);
                } else {
                    channel.updateBlockMessage(web, channelId, punchOut.getQuestionMessage(outInfo.questions[index], index, sumQuestionValue), timestamp);
                }

            } else {
                punchOut.postPunchOut(web, workspaceId, channelId, userId, timestamp, "", "", -1);
            }

        })();

    });

    /*---------------------------------------- All day Yes Button ------------------------------------------*/
    slackActions.action({actionId: 'all_day_yes'}, (payload, respond) => {

        let ptoInfo = JSON.parse(payload.actions[0].block_id);
        let timestamp = payload.message.ts;
        let workspaceId = payload.team.id;

        ptoInfo.isAllDay = true;
        ptoInfo.timestamp = timestamp;
        let triggerId = payload.trigger_id;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            if (parseInt(ptoInfo.hours) > 0) {
                punchPto.preparePTORequest(web, payload.team.id, payload.channel.id, payload.user.id, ptoInfo);
            } else {
                punchPto.openInputHoursDialog(web, triggerId, ptoInfo);
            }

        })();

    });

    /*---------------------------------------- All day No Button ------------------------------------------*/
    slackActions.action({actionId: 'all_day_no'}, (payload, respond) => {

        let ptoInfo = JSON.parse(payload.actions[0].block_id);
        let timestamp = payload.message.ts;
        let workspaceId = payload.team.id;

        ptoInfo.isAllDay = false;
        let channelId = payload.channel.id;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            channel.updateBlockMessage(web, channelId, punchPto.getStartTimeMessage(ptoInfo), timestamp);

        })();

    });

    /*---------------------------------------- All day No Button ------------------------------------------*/
    slackActions.action({actionId: 'delete_pto'}, (payload, respond) => {
        let info = JSON.parse(payload.actions[0].value);
        let ptoId = info.ptoId;
        let startDate = info.startDate;

        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;
        let userId = payload.user.id;
        let timestamp = payload.message.ts;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {

                treering.deletePTO(info.serverInfo, ptoId, info.token).then((result) => {
                    let message = "`On vacation for " + startDate + "` has been deleted.";
                    respond({ text: message,  replace_original: true });
                }).catch((err) => {
                    console.log(err);
                    channel.updateMessage(web, channelId, "Error Occurred", timestamp);
                });

            }).catch((error) => {
                console.log(error);
                channel.updateMessage(web, channelId, "Error Occurred", timestamp);
            });

        })();

    });

    /*---------------------------------------- Help Back Button ------------------------------------------*/
    slackActions.action({actionId: 'help_back'}, (payload, respond) => {

        let timestamp = payload.message.ts;
        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            help.showHelpButtons(web, channelId, timestamp);

        })();

    });

    /*---------------------------------------- Help punch IN / OUT Button ------------------------------------------*/
    slackActions.action({actionId: 'help_in_out'}, (payload, respond) => {

        let timestamp = payload.message.ts;
        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            help.showPunchInOutHelp(web, channelId, timestamp);

        })();

    });

    /*---------------------------------------- Help Leave Button ------------------------------------------*/
    slackActions.action({actionId: 'help_leave'}, (payload, respond) => {

        let timestamp = payload.message.ts;
        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            help.showLeaveHelp(web, channelId, timestamp);

        })();

    });

    /*---------------------------------------- Help Sick Button ------------------------------------------*/
    slackActions.action({actionId: 'help_sick'}, (payload, respond) => {

        let timestamp = payload.message.ts;
        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            help.showSickLeaveHelp(web, channelId, timestamp);

        })();

    });

    /*---------------------------------------- Help Support Button ------------------------------------------*/
    slackActions.action({actionId: 'help_support'}, (payload, respond) => {

        let timestamp = payload.message.ts;
        let workspaceId = payload.team.id;
        let channelId = payload.channel.id;

        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            help.showSupportHelp(web, channelId, timestamp);

        })();

    });
};

module.exports = {handle};