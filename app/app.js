let userSettings = {
    clockVersion: "12"
};

pullUserSettings();
refreshDateTime();
refreshWeather();

let clockTick = setInterval(refreshDateTime, 1000);
let weatherTick = setInterval(refreshWeather, 60000);

function refreshWeather() {

}

function refreshDateTime(clockVersion) {
    let d = new Date();
    let hours = 0;
    let ampm = "";
    if(userSettings.clockVersion === "24") {
        hours = padDigits(d.getHours());
    } else {
        hours = d.getHours() % 12;
        ampm = d.getHours() > 11 ? "PM" : "AM";
    }
    document.getElementsByClassName("hour")[0].innerHTML = hours;
    document.getElementsByClassName("am-pm")[0].innerHTML = ampm;
    document.getElementsByClassName("minute")[0].innerHTML = padDigits(d.getMinutes());
    document.getElementsByClassName("second")[0].innerHTML = padDigits(d.getSeconds());
}

function pullUserSettings() {
    chrome.storage.sync.get([ 
        'clockVersion' 
    ], function(result) {
        userSettings.clockVersion = result.clockVersion
    });
}

function padDigits(value) {
    let result = value.toString();
    if(result.length < 2) {
        result = "0" + result;
    }
    return result;
}