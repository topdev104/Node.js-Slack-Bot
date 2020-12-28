const apiController = require('../controllers/apiController');

module.exports = function(app) {
    // workspace routes
    app.post('/workspaces', [
        apiController.createWorkspace
    ]);

    app.put('/workspaces', [
        apiController.updateWorkspace
    ]);

    app.delete('/workspaces', [
        apiController.deleteWorkspace
    ]);

    // event routs
    app.post('/triggerEvent', [
        apiController.triggerEvent
    ]);

    // slack Redirect API
    app.get('/oauth', [
        apiController.sendAuthRequest
    ]);
};