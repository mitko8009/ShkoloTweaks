// var cookies = document.cookie.split(';').reduce(function(acc, cookie) {
//     var [key, value] = cookie.split('=').map(function(part) { return part.trim(); });
//     acc[key] = value;
//     return acc;
// }, {});
// console.log(cookies);

function loadScheduleData() {
    ajax('https://app.shkolo.bg/ajax/diary/getScheduleForClass?pupil_id=2400132434&year=25&week=14', 'GET', '', function(response) {
        const parser = new DOMParser();
        response = parser.parseFromString(response, 'text/html');
        response = response.getElementsByClassName('scheduleTable')[0];
    });
}

// console.log(loadScheduleData());