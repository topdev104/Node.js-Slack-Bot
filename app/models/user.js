const level = require('level');
const db  = level(USER_DB);

let users = {};
let questions = {};
let pto = {};

const user = {
    addUserToMemory: addUserToMemory,
    getUserFromMemory: getUserFromMemory,
    getUserFromDB: getUserFromDB,
    addUserToDB: addUserToDB,
    addQuestions: addQuestions,
    getQuestions: getQuestions,
    addPTO: addPTO,
    getPTO: getPTO,
    addOutInfo: addOutInfo,
    getOutInfo: getOutInfo
};

function addUserToMemory(userId, data) {
    users[userId] = data;
}

function getUserFromMemory(userId){
    return users[userId];
}

function getUserFromDB(userId) {
    return new Promise((resolve,reject) => {

        db.get(userId, function (err, value) {

            if (err || value === undefined || value === null) {
                reject(err);

            } else {

                try {

                    users[userId] = JSON.parse(value);
                    resolve(user);

                } catch (e) {
                    users[userId] = undefined;
                    console.log(e);
                }

            }
        });
    });
}


function addUserToDB(userId, data) {
    db.put(userId, JSON.stringify(data));
    users[userId] = data;
}

function addQuestions(userId, question) {
    questions[userId].questions = question;
}

function getQuestions(userId) {
    return questions[userId].questions;
}

function addPTO(userId, data) {
    pto[userId] = data;
}

function getPTO(userId) {
    return pto[userId];
}

function addOutInfo(userId, data) {
    questions[userId] = data;
}

function getOutInfo(userId) {
    return questions[userId];
}

module.exports = user;



