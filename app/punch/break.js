const auth = require('../slack/util/auth');
const channel = require('../slack/util/channel');
const treering = require('../api/treering');
const util = require('../common/util');

/*
 *  Process for Punch Break
 */

//Create punch in Request.
exports.start = function(web, channelId, info, message) {
    let workspaceId = info.workspaceId;
    let userId = info.userId;

    if (message.includes('start')) {
        this.postPunchBreak(web, workspaceId, channelId, userId, BREAK_START);
    } else if (message.includes('end')) {
        this.postPunchBreak(web, workspaceId, channelId, userId, BREAK_END);
    }
};

exports.postPunchBreak = function(web, workspaceId, channelId, userId, punchType) {

    auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {

        let punchInfo = util.preparePunchInfo(info.userInfo.cardId, punchType, null, null,null, -1);

        treering.postPunch(info.serverInfo, info.token, punchInfo).then((isSuccess) => {
            let successMessage = "";

            if (punchType === BREAK_START) {
                successMessage = "Enjoy your break."
            } else {
                successMessage = "You got back from break."
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

            if (punchType === BREAK_START) {
                channel.sendBlockMessage(web, channelId, "Start Break Error!");
            } else {
                channel.sendBlockMessage(web, channelId, "End Break Error!");
            }

        });

    }).catch((error) => {
        console.log(error);
    });

};