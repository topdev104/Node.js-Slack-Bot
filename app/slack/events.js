const auth = require('./util/auth');
const treering = require('../api/treering');
const channel = require('./util/channel');
const workspace = require('../models/workspace');

const handle = (slackEvents, web) => {

    slackEvents.on('app_home_opened', (event, body) => {

        let workspaceId = body.team_id;
        let channelId = event.channel;
        let userId = event.user;
        let botTokenError = false;

        (async () => {

            web.token = await auth.getBotToken(workspaceId, web, channelId).catch ((error) => {
                console.log(error);
                botTokenError = true;
            });

            if (botTokenError) return null;

            checkFirstOpened(workspaceId, web, channelId);

            auth.checkWorkspace(workspaceId).then((serverInfo) => {

                treering.getToken(workspaceId, serverInfo).then((tokenInfo) => {
                    let token = "bearer "+ tokenInfo;
                    workspace.addToken(workspaceId, token);

                    auth.checkConfig(workspaceId).then((config) => {

                        auth.checkUser(userId).then((isSuccess) => {

                        }).catch ((error) => {
                            console.log(error);
                            showLoginMessage(web, channelId);
                        });

                    }).catch((error) => {
                        console.log(error);
                        channel.sendMessage(web, channelId, "We can't get your workspace configuration data.");
                    });

                }).catch((error) => {
                    console.log(error);
                    channel.sendMessage(web, channelId, "We cant' connect to your treering time server. Please check your network connection or server status.");
                });

            }).catch((error) => {
                console.log(error);
                channel.sendMessage(web, channelId, "Your workspace is not registered to Treering Time. Please register your workspace ID : " + body.team_id + " to TreeRing Time by contacting support team.");
            });

        })();

    });
};

function showLoginMessage(web, channelId) {
    const message = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Please login to get started.*"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "action_id": "login_clicked",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Login"
                    },
                    "style": "primary"
                }
            ]
        }
    ];

    channel.sendBlockMessage(web, channelId, message);
}

function checkFirstOpened(workspaceId, web, channelId) {
    let isAppFirstOpened = workspace.getIsAppFirstOpened(workspaceId);

    if (isAppFirstOpened !== null && isAppFirstOpened === false) {
        channel.sendBlockMessage(web, channelId, [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Hi, welcome. :wave: Type `help` to get started."
                }
            }
        ]);

        workspace.setIsAppFirstOpened(workspaceId, true);
    }
}

module.exports = {handle, showLoginMessage};