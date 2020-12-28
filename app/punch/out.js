const auth = require('../slack/util/auth');
const channel = require('../slack/util/channel');
const user = require('../models/user');
const treering = require('../api/treering');
const util = require('../common/util');

/*
 *  Process for Punch Out
 */

//Create punch in Request.
exports.start = function(web, channelId, info) {

    let workspaceId = info.workspaceId;
    let config = info.configInfo;
    let userId = info.userId;

    if (config.requireTip === true || config.requireQuantity === true) {
        showTipQuantityButton(web, config, channelId);

    } else {

        if (config.attestationQuestions === true) {
            showQuestion(info, web, channelId);
        } else {
            this.postPunchOut(web, workspaceId, channelId, userId, null, "", "", -1);
        }

    }

};

function showTipQuantityButton(web, config, channelId) {
    let message = "Please click button to enter ";

    if (config.requireTip === true && config.requireQuantity === true) {
        message += "tip and quantity.";
    } else if (config.requireTip === true) {
        message += "tip.";
    } else if (config.requireQuantity) {
        message += "quantity.";
    }

    let block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": message
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Click here",
                    "emoji": true
                },
                "action_id": "tip_quantity_clicked",
                "value": "1"
            }
        }
    ];

    channel.sendBlockMessage(web, channelId, block);
}

exports.openTipAndQuantityInputDialog = function(web, config, triggerId, timestamp) {

    let elements = [];
    let headerMessage = "";

    if (config.requireTip === true && config.requireQuantity === true) {
        headerMessage = "Enter tip and quantity";
    } else if (config.requireTip === true) {
        headerMessage = "Enter tip";
    } else if (config.requireQuantity) {
        headerMessage = "Enter quantify";
    }

    if (config.requireTip === true) {
        elements.push({
            "label": "Tip",
            "name": "tip",
            "type": "text",
        });
    }


    if (config.requireQuantity === true) {
        elements.push({
            "label": "Quantity",
            "name": "quantity",
            "type": "text"
        });
    }

    let dialog = {
        callback_id: 'dialog/out/submit',
        state: timestamp,
        title: headerMessage,
        submit_label: 'OK',
        elements: elements
    };

    let params = {trigger_id: triggerId, dialog: dialog, token: web.token};

    (async () => {
        try {
            const result = await web.dialog.open(params);
        } catch (error) {
            console.log(error.data);
        }
    })();
};

exports.showQuestion = function(info, web, channelId, timestamp) {
    let userId = info.userId;
    let workspaceId = info.workspaceId;
    let serverUrl = info.serverInfo;
    let token = info.token;
    let userInfo = info.userInfo;

    treering.getQuestions(serverUrl, userInfo.cardId, token).then((questions) => {

        if (questions.length > 0) {
            user.addQuestions(userId, questions);
            channel.updateBlockMessage(web, channelId, this.getQuestionMessage(questions[0], 0, 0), timestamp);

        } else {

            let outInfo = user.getOutInfo(userId);

            let tip = "";
            let quantity = "";

            if (outInfo !== undefined) {
                tip = outInfo.tip;
                quantity = outInfo.quantity
            }

            this.postPunchOut(web, workspaceId, channelId, userId, null, tip, quantity, -1);
        }

    }).catch(error => {
        console.log(error);
    });
};

exports.postPunchOut = function(web, workspaceId, channelId, userId, timestamp, tip, quantity, questionValue) {

    auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {

        let punchInfo = util.preparePunchInfo(info.userInfo.cardId, OUT, tip, quantity,null, questionValue);

        treering.postPunch(info.serverInfo, info.token, punchInfo).then((isSuccess) => {
            let message = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "You've punched out successfully. To punch out type `in`."
                    }
                }
            ];

            if (timestamp !== null) {
                channel.updateBlockMessage(web, channelId, message, timestamp);
            } else {
                channel.sendBlockMessage(web, channelId, message);
            }

        }).catch ((error) => {
            console.log(error);
            channel.updateMessage(web, channelId, "Punch Out Error!", timestamp);
        });

    }).catch((error) => {
        console.log(error);
    });
};

exports.getQuestionMessage = function (question, index, sumQuestionValue) {

    return [
        {
            "type": "section",
            "fields": [

                {
                    "type": "mrkdwn",
                    "text": "*Questions:*\n\"" + question.promptEnglish  + "\""
                }
            ]
        },
        {
            "type": "actions",
            "block_id": sumQuestionValue.toString(),
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Yes"
                    },
                    "style": "primary",
                    "action_id": "question_yes",
                    "value": index.toString()
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "No"
                    },
                    "style": "danger",
                    "action_id": "question_no",
                    "value": index.toString()
                }
            ]
        }
    ];
};
