const axios = require('axios');

function sendMessage(web, channelId, message) {
    (async () => {
        try {
            const result = await web.chat.postMessage({
                text: message,
                channel: channelId,
            });
        } catch (error) {
            console.log(error.data);
        }
    })();
}

function sendBlockMessage(web, channelId, message) {
    (async () => {
        try {
            const result = await web.chat.postMessage({
                text: "",
                blocks:message,
                channel: channelId,
            });
        } catch (error) {
            console.log(error.data);
        }

    })();
}

function updateMessage(web, channelId, message, timeStamp) {
    (async () => {
        try {
            const result = await web.chat.update({
                text: message,
                channel: channelId,
                ts: timeStamp
            });
        } catch (error) {
            console.log(error.data);
        }

    })();
}

function updateBlockMessage(web, channelId, message, timeStamp) {
    (async () => {
        try {
            const result = await web.chat.update({
                text: "",
                blocks:message,
                channel: channelId,
                ts: timeStamp
            });
        } catch (error) {
            console.log(error.data);
        }

    })();
}

function showLoginDialog(web, config, triggerId){
    let elements = [];

    elements.push({
        "label": "Card ID",
        "name": "card_id",
        "type": "text",
    });

    if (config !== undefined && config.authenticationMode === "UseCardIdAndPIN") {
        elements.push({
            "label": "PIN",
            "name": "pin",
            "type": "text"
        });
    }

    let dialog = {
        callback_id: 'dialog/login/submit',
        title: 'Login to your account',
        submit_label: 'Login',
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
}

function getWorkspaceId() {
    return new Promise((resolve,reject) => {
        let url = 'https://slack.com/api/team.info?token=' + process.env.SLACK_BOT_TOKEN;

        axios.get(url)
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                reject(error);
            });
    });
}

module.exports = {sendMessage, sendBlockMessage, updateBlockMessage, updateMessage, getWorkspaceId, showLoginDialog};