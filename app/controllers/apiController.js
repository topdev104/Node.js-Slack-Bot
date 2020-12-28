const request = require('request');

const workspace = require('../models/workspace');
const config = require('../models/configuration');
const token = require('../models/token');
const treering = require('../api/treering');

exports.createWorkspace = function(req, res) {
    let workspaceId = req.body.workspaceId;
    let serverUrl = req.body.serverUrl;

    workspace.addWorkspaceToDB(workspaceId, serverUrl).then((data) => {
        res.status(200).send("Workspace was added successfully.");
    }).catch((err) => {
        res.status(403).send("Failed to add workspace!");
        console.log(err);
    });
};

exports.updateWorkspace = function(req, res) {
    let workspaceId = req.body.workspaceId;
    let serverUrl = req.body.serverUrl;

    workspace.addWorkspaceToDB(workspaceId, serverUrl).then((data) => {
        res.status(200).send("Workspace was updated successfully.");
    }).catch((err) => {
        res.status(403).send("Failed to update workspace!");
        console.log(err);
    });
};

exports.deleteWorkspace = function(req, res) {
    let workspaceId = req.body.workspaceId;

    workspace.deleteWorkspace(workspaceId).then((data) => {
        res.status(200).send("Workspace was deleted successfully");
    }).catch((err) => {
        res.status(403).send("Failed to delete workspace!");
        console.log(err);
    });
};

exports.triggerEvent = function(req, res) {
    let workspaceId = req.body.workspaceId;
    let events = req.body.events;

    let workspaceInfo = workspace.getWorkspaceFromMemory(workspaceId);

    if (workspaceInfo === undefined) {
        res.status(551).send("Invalid WorkspaceID!");
        return;
    }

    let serverUrl = workspaceInfo.serverUrl;
    let token = workspaceInfo.token;

    events.forEach(function(event) {
        if (event === KEY_SYNC_CLOCK_SETUP) {
            treering.getWorkspaceConfig(serverUrl, token).then((configData) => {
                config.addConfigToDB(workspaceId, configData);
            });
        } else if (event === KEY_SYNC_LEVELCODES) {
            treering.getLevels(serverUrl, token).then((level) => {
                workspace.setLevel(workspaceId, level);
            });

            treering.getLevelHierarchyPlans(serverUrl, token).then((levelHierarchyPlan) => {
                workspace.setLevelHierarchyPlan(workspaceId, levelHierarchyPlan);
            });
        }
    });

    res.status(200).send("Events was accepted");
};

exports.sendAuthRequest = function(req, res) {
    let code = req.query.code;

    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url: 'https://slack.com/api/oauth.access',
        body: "client_id=" + process.env.CLIENT_ID + "&" + "client_secret=" + process.env.CLIENT_SECRET + "&" + "code=" + code
    }, function(error, response, body){

        let bodyJSON = JSON.parse(body);

        if (bodyJSON.ok === true) {

            let teamId = bodyJSON.team_id;
            let botAccessToken = bodyJSON.bot.bot_access_token;

            token.addTokenToDB(teamId, botAccessToken).then((data) => {
                console.log(data);
            }).catch((err) => {
                console.log(err);
            });

            workspace.setIsAppFirstOpened(teamId, false);

            return res.redirect('https://treeringws.com/treering-time-bot-install-success');

        } else {
            return res.redirect('https://treeringws.com/treering-time-bot-install-failed');
        }

    });
};