const events = require('events');
const punchIn = require('../punch/in');
const punchOut = require('../punch/out');
const punchLunch = require('../punch/lunch');
const punchBreak = require('../punch/break');
const pto = require('../punch/pto');
const deletePTO = require('../punch/delete');
const help = require('../punch/help');
const auth = require('./util/auth');
const channel = require('./util/channel');

const handle = (slackEvents, web) => {

    slackEvents.on('message', (event, body) => {

        if (event.client_msg_id === undefined) {//check to see if message is input by user.
            return;
        }

        let workspaceId = body.team_id;
        let channelId = event.channel;
        let userId = event.user;
        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {

                let inputMessage = event.text.toLowerCase();

                if (inputMessage.includes('in')) {
                    punchIn.start(web, channelId, info);
                } else if (inputMessage.includes('out')) {
                    punchOut.start(web, channelId, info);
                } else if (inputMessage.includes('lunch')) {
                    punchLunch.start(web, channelId, info, inputMessage);
                } else if (inputMessage.includes('break')) {
                    punchBreak.start(web, channelId, info, inputMessage);
                } else if (inputMessage.includes('leave') || inputMessage.substring(0, 2) === 'sl') {
                    pto.start(web, channelId, info, inputMessage);
                } else if (inputMessage.includes('delete')) {
                    deletePTO.start(web, channelId, info);
                } else if (inputMessage.includes('help')) {
                    help.start(web, channelId);
                } else {
					 channel.sendBlockMessage(web, channelId, [
						{
							"type": "section",
							"text": {
								"type": "mrkdwn",
								"text": "I do not understand what you mean. Type `help` to check correct commands."
							}
						}
					]);
				}

            }).catch((error) => {
                if (error === ERROR_USER) {
                    events.showLoginMessage(web, channelId)
                } else {
                    channel.sendMessage(web, channelId, error);
                }
            });

        })();
    });

    slackEvents.on('error', (error) => {
        console.log(error.name); // TypeError
    });
};

module.exports = {handle};