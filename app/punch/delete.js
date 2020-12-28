const channel = require('../slack/util/channel');
const treering = require('../api/treering');
const moment = require('moment');

/*
 *  Process for pto request
 */

//Create punch in Request.
exports.start = function(web, channelId, info) {
    let serverUrl = info.serverInfo;
    let token = info.token;
    let cardId = info.userInfo.cardId;

    treering.getAllPTO(serverUrl, cardId, token).then((ptoArray) => {
        if (ptoArray.length > 0) {
            showDeleteMessage(web, channelId, ptoArray);
        } else {
            showLeavesMessage(web, channelId);
        }
    }).catch((err) => {
        console.log(err);
        showErrorMessage(web, channelId);
    });
};

function showErrorMessage(web, channelId) {
    channel.sendBlockMessage(web, channelId, "Please type correct command!");
}

function showLeavesMessage(web, channelId) {
    channel.sendBlockMessage(web, channelId, "No leaves for you.");
}

function showDeleteMessage (web, channelId, ptoArray) {
    let leaveCount = 0;

    for (let i = 0; i < ptoArray.length; i++) {
        let startDate = moment(ptoArray[i].requestedDate).format("dddd, MMMM DD, YYYY");

        if (moment().diff(moment(ptoArray[i].requestedDate), 'days') <= 0) {

            leaveCount ++;

            setTimeout(function () {
                let info = {
                    ptoId: ptoArray[i].ptoRequestId.toString(),
                    startDate: startDate
                };

                let message = [];

                message.push({
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "On vacation for *" + startDate + "*\nBank:  *" + ptoArray[i].payTypeDescription + "*  Hours per Day:  *" + ptoArray[i].hours + "*"
                    },
                    accessory: {
                        type: "button",
                        text: {
                            type: "plain_text",
                            emoji: true,
                            text: "Delete"
                        },
                        action_id: "delete_pto",
                        value: JSON.stringify(info)
                    }
                });

                channel.sendBlockMessage(web, channelId, message);
            }, 200 * i);
        }
    }

    if (leaveCount === 0) channel.sendMessage(web, channelId, "No leaves for you.");
}