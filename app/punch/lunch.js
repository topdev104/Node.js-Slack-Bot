const auth = require('../slack/util/auth');
const channel = require('../slack/util/channel');
const treering = require('../api/treering');
const util = require('../common/util');

/*
 *  Process for Punch Lunch
 */

//Create punch in Request.
exports.start = function(web, channelId, info, message) {
    let workspaceId = info.workspaceId;
    let userId = info.userId;
    let minimumLunchDuration = info.configInfo.minimumLunchDuration;

    if (message.includes('start')) {
        this.postPunchLunch(web, workspaceId, channelId, userId, LUNCH_START, minimumLunchDuration);
    } else if (message.includes('end')) {
        this.postPunchLunch(web, workspaceId, channelId, userId, LUNCH_END, minimumLunchDuration);
    }
};

exports.postPunchLunch = function(web, workspaceId, channelId, userId, punchType, minimumLunchDuration) {

    auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {

        let punchInfo = util.preparePunchInfo(info.userInfo.cardId, punchType, null, null,null, -1);

        treering.postPunch(info.serverInfo, info.token, punchInfo).then((isSuccess) => {

            let successMessage = "";

            if (punchType === LUNCH_START) {
                successMessage = "Enjoy your lunch."
            } else {
                successMessage = "You got back from lunch."
            }

            let message = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": successMessage
                    }
                }
            ];

            channel.sendBlockMessage(web, channelId, message);

        }).catch ((error) => {

            console.log(error);

            if (punchType === LUNCH_START) {
                channel.sendMessage(web, channelId, "Start Lunch Error!");
            } else {

                if (error.response.status === 551) {
                    channel.sendMessage(web, channelId, "Minimum lunch period is " + minimumLunchDuration + " minutes. Please try it " + minimumLunchDuration + " minutes later.");
                } else {
                    channel.sendMessage(web, channelId, "End Lunch Error!");
                }
            }

        });

    }).catch((error) => {
        console.log(error);
    });
};