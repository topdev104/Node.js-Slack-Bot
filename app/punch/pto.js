const auth = require('../slack/util/auth');
const channel = require('../slack/util/channel');
const user = require('../models/user');
const treering = require('../api/treering');
const moment = require('moment');
const util = require('../common/util');

/*
 *  Process for pto request
 */

//Create punch in Request.
exports.start = function(web, channelId, info, message) {
    let serverUrl = info.serverInfo;
    let token = info.token;
    let cardId = info.userInfo.cardId;

    if (message.substring(0, 2) === 'sl') {
        message = message.toString().replace('sl', "").trim();
    } else {
        message = message.toString().replace('leave', "").trim();

        if (message.includes('sick')) {
            message = message.toString().replace('sick', "").trim();
        }
    }

    let ptoInfo = undefined;

    /*--------------------------------- Check message and get pto info from message -------------------------------*/
    /*if (message.includes('half')) {

        if (message.includes('first half')) {
            ptoInfo = getInfoFromMessage(cardId, "08:00:00", 4, message.replace('first half', '').trim());
        } else if (message.includes('second half')){
            ptoInfo = getInfoFromMessage(cardId,"14:00:00", 3, message.replace('second half', '').trim());
        } else {
            showErrorMessage(web, channelId);
        }

    } else */if (message.includes('for')) {

        let newMessage = message.replace('for', '').trim();
        let hoursArray = newMessage.split(' ');

        if (hoursArray.length > 1 && (hoursArray[1].includes('hour') || hoursArray[1].includes('hr'))) {

            let hours = hoursArray[0].trim();

            if (hours == null) {
                showErrorMessage(web, channelId);
                return;
            }

            if (!isNaN(parseInt(hours))) {

                if (hoursArray.length > 2) {
                    let startPoint = hoursArray[0].length + hoursArray[1].length + 2;
                    ptoInfo = getInfoFromMessage(cardId,"", hours, newMessage.substring(startPoint, newMessage.length));
                } else {
                    ptoInfo = getInfoFromMessage(cardId,"", hours, "");
                }

            } else {
                channel.sendBlockMessage(web, channelId, "Please input number for hours");
            }

        } else {
            showErrorMessage(web, channelId);
        }

    } else {
        ptoInfo = getInfoFromMessage(cardId,"", 0, message);
    }
    /*-----------------------------------------------------------------------------------------------------------------*/

    /*------------------------- Get Pto Banks and make static menu for selecting pto banks -------------------------*/
    if (ptoInfo !== null) {

        treering.getPTOBanks(serverUrl, cardId, token).then((ptoBanks) => {
            if (ptoBanks.length > 0) {
                channel.sendBlockMessage(web, channelId, getBankMessage(ptoBanks, ptoInfo));
            } else {
                showErrorMessage(web, channelId);
            }
        }).catch((err) => {
            showErrorMessage(web, channelId);
        });

    } else {
        showErrorMessage(web, channelId);
    }
};


exports.getAllDayMessage = function (ptoInfo) {

    return [
        {
            "type": "section",
            "fields": [

                {
                    "type": "mrkdwn",
                    "text": "*Leave All day?*\""
                }
            ]
        },
        {
            "type": "actions",
            "block_id": JSON.stringify(ptoInfo),
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Yes"
                    },
                    "style": "primary",
                    "action_id": "all_day_yes",
                    "value": "0"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "No"
                    },
                    "style": "danger",
                    "action_id": "all_day_no",
                    "value": "1"
                }
            ]
        }
    ];
};

exports.getStartTimeMessage = function (ptoInfo) {
    let options = [];

    for (let i = 0; i < 24; i ++) {
        for (let j = 0; j < 2; j ++) {
            let hour = "";
            let minute = "";

            if (i >= 10) {
                hour = i.toString();
            } else {
                hour = "0" + i.toString();
            }

            if (j === 0) {
                minute = "00";
            } else {
                minute = "30";
            }

            let time = hour + ":" + minute;

            options.push({
                text: {
                    type: "plain_text",
                    text: time
                },
                value: time
            });
        }
    }

    return [
        {
            "type": "actions",
            "block_id": JSON.stringify(ptoInfo),
            "elements": [
                {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select start time ...",
                        "emoji": true
                    },
                    "action_id": "start_time_select",
                    "options": options,
                }
            ]
        }
    ];
};

exports.openInputHoursDialog = function(web, triggerId, ptoInfo) {

    let elements = [];

    elements.push({
        "label": "Hours",
        "name": "hours",
        "type": "text",
    });

    let dialog = {
        callback_id: 'dialog/pto_hours/submit',
        state: JSON.stringify(ptoInfo),
        title: 'Enter Hours per Day',
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

exports.preparePTORequest = function(web, workspaceId, channelId, userId, ptoInfo) {

    auth.checkAllInfoForPunch(workspaceId, userId).then((info) => {
        let ptoArray = preparePTOArray(ptoInfo);
        let timestamp = ptoInfo.timestamp;
        let resultMessage = ptoInfo.resultMessage;

        if (ptoArray.length > 0) {
            user.addPTO(info.userId, JSON.stringify(ptoArray));
            postPTORequest(web, channelId, 0, info, timestamp, resultMessage);
        } else {
            showErrorMessage(web, channelId);
        }

    }).catch((error) => {
        console.log(error);
        showErrorMessage(web, channelId);
    });
};

function postPTORequest(web, channelId, index, info, timestamp, resultMessage) {
    let ptoString = user.getPTO(info.userId);

    if (ptoString === undefined) {
        showErrorMessage(web, channelId);
        return;
    }

    let ptoArray = JSON.parse(ptoString);

    let ptoItem = ptoArray[index];

    treering.postPTO(info.serverInfo, info.token, ptoItem).then((isSuccess) => {

        if (index === ptoArray.length - 1) {
            let message = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Sure. I have recorded that you are on Vacation" + resultMessage
                    }
                }
            ];

            channel.updateBlockMessage(web, channelId, message, timestamp);

        } else {
            let itemIndex = index;
            itemIndex ++;
            postPTORequest(web, channelId, itemIndex, info, timestamp, resultMessage);
        }

    }).catch ((error) => {
        console.log(error);
        channel.sendBlockMessage(web, channelId, "Punch Out Error!");
    });
}

function preparePTOArray(ptoInfo) {
    let ptoArray = [];

    let startDay = ptoInfo.startDate;
    let endDay = ptoInfo.endDate;

    if (endDay === '') {
        ptoArray.push(getPTOItem(startDay, ptoInfo));
        return ptoArray;
    }

    let startDate = moment(startDay);
    let endDate = moment(endDay);

    let startingMoment = startDate;


    while(startingMoment <= endDate) {
        ptoArray.push(getPTOItem(startingMoment, ptoInfo));
        startingMoment.add(1, 'days');
    }

    return ptoArray;
}

function getPTOItem(ptoDate, ptoInfo) {
    let startTime = "";
    let formattedDate = "";

    if (typeof ptoDate !== 'string') {
        formattedDate = ptoDate.format().toString();
    } else {
        formattedDate = ptoDate;
    }

    if (ptoInfo.isAllDay === true) {
        startTime = null;
    } else {
        startTime = formattedDate.substring(0, 11) + ptoInfo.startTime + ":00Z";
    }

    return {
        "ptoRequestId": 0,
        "cardID": ptoInfo.cardId,
        "requestedDate": formattedDate.toString() + "Z",
        "payTypeId": parseInt(ptoInfo.payTypeId),
        "hours": parseInt(ptoInfo.hours),
        "startTime": startTime,
        "notes": ptoInfo.note,
        "isAllDay": ptoInfo.isAllDay
    }
}

function getInfoFromMessage(cardId, startTime, hours, message) {
    let startDate = "";
    let endDate = "";
    let note = "";
    let resultMessage = "";
    let hourMessage = "";

    if (parseInt(hours) !== 0) {
        if (parseInt(hours) === 1) {
            hourMessage = " for " + hours + " hour";
        } else {
            hourMessage = " for " + hours + " hours";
        }
    }

    if (message === "") {
        startDate = moment().format();
        resultMessage = hourMessage + " Today.";

    } else {

        let commandArray = message.split(" ");

        if (commandArray[0] === null) {
            return null;
        }

        let preposition = commandArray[0].trim().toLowerCase();

        if (preposition === "today") {
            startDate = moment().format();
            resultMessage = hourMessage + " Today.";

        } else if (preposition === "tomorrow"){
            startDate = moment().add(1, 'days').format();
            resultMessage = hourMessage + " Tomorrow.";

        } else if (preposition === "on") {

            let date = commandArray[1].trim();

            if (date === null) {
                return null;
            }

            let weekday_result = util.getDateFromWeekDay(date);

            if (weekday_result !== "") {
                startDate = weekday_result;
                resultMessage = hourMessage + " on " + moment(startDate).format("dddd, MMMM DD, YYYY") + ".";

            } else {

                let formatted_date = util.getDateFromInput(date);

                if (formatted_date !== "") {
                    startDate = formatted_date;
                    resultMessage = hourMessage + " on " + moment(startDate).format("dddd, MMMM DD, YYYY") + ".";
                } else {
                    return null;
                }
            }

        } else if (preposition === "from") {

            let start_date = commandArray[1].trim();

            if (start_date == null) {
                return;
            }

            let start_formatted_date = util.getDateFromInput(start_date)

            if (start_formatted_date === "") {
                return null;
            }

            startDate = start_formatted_date;

            let to_array = message.split("to");
            let end_date = to_array[1].trim();

            if (end_date === null) {
                return null
            }

            let last_formatted_date = util.getDateFromInput(end_date);

            if (last_formatted_date === "") {
                return null;
            }

            endDate = last_formatted_date;

            resultMessage = hourMessage + " from " + moment(start_formatted_date).format("MMMM DD, YYYY") + " to " + moment(last_formatted_date).format("MMMM DD, YYYY");
        }
    }

    let noteArray = message.split(",");

    if (noteArray[1] !== undefined) {
        note = noteArray[1].trim();
    }


    return {
        cardId: cardId,
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        hours: hours,
        payTypeId: "",
        isAllDay: undefined,
        note: note,
        resultMessage: resultMessage,
        timestamp: ""
    };
}

function showErrorMessage(web, channelId) {
    channel.sendBlockMessage(web, channelId, "Please type correct command!");
}

function getBankMessage (ptoBanks, ptoInfo) {
    let options = [];

    for (let i = 0; i < ptoBanks.length; i++){
        options.push({
            text: {
                type: "plain_text",
                text: ptoBanks[i].payTypeDescription
            },
            value: ptoBanks[i].payTypeId.toString()
        });
    }

    return [
        {
            "type": "actions",
            "block_id": JSON.stringify(ptoInfo),
            "elements": [
                {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select Bank ...",
                        "emoji": true
                    },
                    "action_id": "bank_select",
                    "options": options,
                }
            ]
        }
    ];
}