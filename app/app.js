let userSettings = {
    clockVersion: "12",
    location: "auto",
    dateFormat: "",
    backgroundColor: "#0099ff",
    fontColor: "#000000"
};
let coords = null;

//fixme once settings installed
//pullUserSettings(); 
setDisplayPreferences();
refreshDate();
let clockTick = setInterval(refreshTime, 1000);
let weatherTick = setInterval(refreshWeather, 60000);

function displayError(message) {
    document.getElementsByClassName("errorMessage")[0].innerHTML = message;
}

function setDisplayPreferences() {
    document.body.style.backgroundColor = userSettings.backgroundColor;
    document.body.style.color= userSettings.fontColor;
}

function refreshWeather() {
    if(coords == null) {
        //display wait spinner
        if(userSettings.location == "auto") {
            navigator.geolocation.getCurrentPosition((position) => {
                coords = position.coords.latitude.toString() + ", " + position.coords.longitude.toString();
                // hide wait spinner
                // call weather API
                document.getElementsByClassName("coords")[0].innerHTML = coords;
            }, (err) => {
                //hide wait spinner
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        displayError(chrome.i18n.getMessage("error_localization_user_denied"));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        displayError(chrome.i18n.getMessage("error_localization_location_unavailable"));
                        break;
                    case error.TIMEOUT:
                        displayError(chrome.i18n.getMessage("error_localization_timeout"));
                        break;
                    case error.UNKNOWN_ERROR:
                        displayError(chrome.i18n.getMessage("error_localization_generic"));
                        break;
                }
            });
        } else {
            //hide wait spinner
            displayError(chrome.i18n.getMessage("error_localization_generic"));
        }
    }
}

function refreshDate() {
    document.getElementsByClassName("date")[0].innerHTML = formatDate(new Date());
}

function refreshTime(clockVersion) {
    let d = new Date();
    let hours = 0;
    let ampm = "";
    if(userSettings.clockVersion === "24") {
        hours = padDigits(d.getHours());
    } else {
        hours = d.getHours() % 12;
        if(hours == 0) { hours = 12; }
        ampm = d.getHours() > 11 ? "PM" : "AM";
    }
    if(d.getHours() == d.getMinutes() == d.getSeconds() == 0) {
        refreshDate();
    }
    document.getElementsByClassName("hour")[0].innerHTML = hours;
    document.getElementsByClassName("am-pm")[0].innerHTML = ampm;
    document.getElementsByClassName("minute")[0].innerHTML = padDigits(d.getMinutes());
    document.getElementsByClassName("second")[0].innerHTML = padDigits(d.getSeconds());
}

function pullUserSettings() {
    chrome.storage.sync.get([ 
        'clockVersion',
        'location' 
    ], (result) => {
        userSettings.clockVersion = result.clockVersion;
        userSettings.location = result.location;
        refreshDateTime();
        refreshWeather();
    });
}

// TODO: allow for custom date formats based on user setting
function formatDate(jsDate, dateFormat) {
    const monthNames = [ "jan", "feb", "mar", "apr", "may", "jun", 
        "jul", "aug", "sep", "oct", "nov", "dec" ];
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    
    return chrome.i18n.getMessage(dayNames[jsDate.getDay()])
        + ", " 
        + chrome.i18n.getMessage(monthNames[jsDate.getMonth()])
        + " "
        + jsDate.getDate()
        + ", "
        + jsDate.getFullYear();
}

function padDigits(value) {
    let result = value.toString();
    if(result.length == 1) {
        result = "0" + result;
    }
    return result;
}