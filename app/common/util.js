const moment = require('moment');

exports.preparePunchInfo = (cardId, punchType, tip, quantity, levels, attestationAnswer) => {
    return {
        cardId: cardId,
        punchType: punchType,
        dateTime: getCurrentTime(),
        tip: tip === null ? "" : tip,
        quantity: quantity === null ? "" : quantity,
        levels: levels === null ? [] : levels,
        attestationAnswer: attestationAnswer === -1 ? "" : attestationAnswer,
        onlinePunch: true
    }
};

exports.getDateFromWeekDay = (weekday) => {
    let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    for (let i = 0; i < days.length; i++) {
        if (weekday.toLowerCase() === days[i].toLowerCase()) {
            let now = new Date();
            let day_number = now.getDay();
            let diff = i - day_number;

            if (diff < 0) {
                diff = 7 - day_number + i;
            }

            return moment().add(diff, 'days').format();
        }
    }

    return "";
};

exports.getDateFromInput = (input_date) => {
    let now = new Date();
    let date  = input_date + "-" + now.getFullYear();

    if (!moment(date, "MM-DD-YYYY").isValid()) {
        return "";
    } else {
        return moment(input_date, 'MM-DD-YYYY').format();
    }
};


function getCurrentTime() {
    let utcTime = moment().utc().format('YYYY-MM-DDThh:mm:ss');
    return utcTime + 'Z';
}