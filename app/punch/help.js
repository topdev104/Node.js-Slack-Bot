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
exports.start = function(web, channelId) {
    this.showHelpButtons(web, channelId, null);
};

exports.showHelpButtons = function(web, channelId, timestamp) {
    const message = [
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "How may I help you? To know more in detail, click on a button below:"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Time Tracking*"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "action_id": "help_in_out",
                    "text": {
                        "type": "plain_text",
                        "text": "Punch IN/OUT"
                    }
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Time Off*"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "action_id": "help_leave",
                    "text": {
                        "type": "plain_text",
                        "text": "LEAVE"
                    }
                },
                {
                    "type": "button",
                    "action_id": "help_sick",
                    "value": "2",
                    "text": {
                        "type": "plain_text",
                        "text": "SICK"
                    }
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Support*"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "action_id": "help_support",
                    "value": "3",
                    "text": {
                        "type": "plain_text",
                        "text": "Support"
                    }
                }
            ]
        },
        {
            "type": "divider"
        }
    ];

    if (timestamp != null) {
        channel.updateBlockMessage(web, channelId, message, timestamp);
    } else {
        channel.sendBlockMessage(web, channelId, message);
    }
};

exports.showPunchInOutHelp = function(web, channelId, timestamp) {
    const message = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Type `in` to punch in and `out` to punch out.\n Type `start break` or `end break` to start or end break. \n Type `start lunch` or `end lunch` to start or end lunch."
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "action_id": "help_back",
                    "text": {
                        "type": "plain_text",
                        "text": "Back to help"
                    }
                }
            ]
        }
    ];

    channel.updateBlockMessage(web, channelId, message, timestamp);
};

exports.showLeaveHelp = function(web, channelId, timestamp) {
    const message = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Type `leave` for leave. \n Type `delete` to delete unapproved PTO requests.\n"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Examples:*"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "leave today\n leave tomorrow\n leave on Thursday\n leave on 10-02\n leave from 10-17 to 10-20\n leave from 10-17 to 10-20, Conference at San Jose  (you can also specify comma separated reason for leave) \n\n leave first half\n leave second half\n\n leave for 2 hrs\n leave for 3 hrs on 09-15\n leave for 2 hours from 09-12 to 09-18"
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
                    "action_id": "help_back",
                    "text": {
                        "type": "plain_text",
                        "text": "Back to help"
                    }
                }
            ]
        }
    ];

    channel.updateBlockMessage(web, channelId, message, timestamp);
};

exports.showSickLeaveHelp = function(web, channelId, timestamp) {
    const message = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Type `sick leave` or `sl` for sick leave. \n Type `delete` to delete unapproved PTO requests.\n"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Examples:*"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "sick leave today\n sl tomorrow\n sick leave on Thursday\n sl on 10-02\n sick leave from 10-17 to 10-20\n sick leave from 10-17 to 10-20, Conference at San Jose  (you can also specify comma separated reason for sick leave) \n\n sick leave first half\n sl second half\n\n sick leave for 2 hrs\n sl for 3 hrs on 09-15\n sl for 2 hours from 09-12 to 09-18"
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
                    "action_id": "help_back",
                    "text": {
                        "type": "plain_text",
                        "text": "Back to help"
                    }
                }
            ]
        }
    ];

    channel.updateBlockMessage(web, channelId, message, timestamp);
};

exports.showSupportHelp = function(web, channelId, timestamp) {
    const message = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Send us an email at `support@treeringws.com` and someone from our customer support team will get back to you ASAP."
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "action_id": "help_back",
                    "text": {
                        "type": "plain_text",
                        "text": "Back to help"
                    }
                }
            ]
        }
    ];

    channel.updateBlockMessage(web, channelId, message, timestamp);
};