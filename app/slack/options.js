const handle = (slackActions, web) => {

    slackActions.options({ within: 'block_actions' }, (payload) => {

        if (payload.action_id === "hierarchy_select") {

        }
    });

    slackActions.options({ within: 'interactive_message' }, (payload) => {

    });

    slackActions.options({ within: 'dialog' }, (payload) => {

    });
};

module.exports = {handle};