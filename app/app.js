import OpenWeatherMap from "./owm-weather.js";

let userSettings = {};
let coords = null;

// Check if it's their first time running the app (or if their settings were nuked)
// and set them up with defaults if necessary
chrome.storage.sync.get(['initialized'], (result) => {
    if(!!result) {
        setDefaultUserSettings();
    }
});

// Get their settings out of storage (which refreshes views)
pullUserSettings(); 

// Set in motion regular checks to update the clock and the weather
let clockTick = setInterval(refreshTime, 1000);
let weatherTick = setInterval(refreshWeather, 60000);

function displayError(message) {
    document.getElementsByClassName("errorMessage")[0].innerHTML = message;
}

function setDisplayPreferences() {
    document.body.style.backgroundColor = userSettings.backgroundColor;

    // Based on the background color, pick light or dark text
    let bodyrgb = window.getComputedStyle(document.body).backgroundColor
    let bodyrgbvals = bodyrgb.slice(4,bodyrgb.length-1).split(',');
    let backgroundIsDark = (1 - (0.299 * bodyrgbvals[0] + 0.587 * bodyrgbvals[1] + 0.114 * bodyrgbvals[2]) / 255) > .5;
    if(backgroundIsDark) {
        document.body.classList.remove("light");
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
    }
}

function refreshWeather() {
    //FIXME: show wait spinner
    switch(userSettings.location) {
        case "auto":
            if(coords == null) {
                refreshCoordinates(() => {
                    OpenWeatherMap.getCurrentWeatherByCoords(coords.latitude, coords.longitude, userSettings.units, (response) => {
                        showWeatherData(response);
                    });
                });
            } else {
                OpenWeatherMap.getCurrentWeatherByCoords(coords.latitude, coords.longitude, userSettings.units, (response) => {
                    showWeatherData(response);
                });
            }
            break;
        case "zip":
            //FIXME: Hardcoded zip for testing
            OpenWeatherMap.getCurrentWeatherByZip("80204", (response) => {
                showWeatherData(response);
            });
            break;
        default:
            displayError(chrome.i18n.getMessage("error_location_variable"));
            break;
    }
    //FIXME: Remove wait spinner
}

function showWeatherData(data) {

}

function refreshCoordinates(callback) {
    if(userSettings.location == "auto") {
        navigator.geolocation.getCurrentPosition((position) => {
            coords = { latitude: position.coords.latitude.toString(), longitude: position.coords.longitude.toString() };
            callback();
        }, (err) => {
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
        displayError(chrome.i18n.getMessage("error_localization_generic"));
    }
}

function refreshDate() {
    document.getElementsByClassName("date")[0].innerHTML = formatDate(new Date());
}

function refreshTime() {
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
    document.getElementsByClassName("second")[0].innerHTML = 
        userSettings.showSeconds ? padDigits(d.getSeconds()) : "";
}

function pullUserSettings() {
    chrome.storage.sync.get([ 
        'clockVersion',
        'location',
        'dateFormat',
        'backgroundColor',
        'showSeconds',
        'units'
    ], (result) => {
        userSettings.clockVersion = result.clockVersion;
        userSettings.location = result.location;
        userSettings.dateFormat = result.dateFormat;
        userSettings.backgroundColor = result.backgroundColor;
        userSettings.showSeconds = result.showSeconds;
        userSettings.units = result.units;
        setDisplayPreferences();
        refreshTime();
        refreshDate();
        refreshWeather();
    });
}

function setDefaultUserSettings() {
    chrome.storage.sync.set({initialized: true});
    chrome.storage.sync.set({clockVersion: '12'});
    chrome.storage.sync.set({location: 'auto'});
    chrome.storage.sync.set({dateFormat: 'US'});
    chrome.storage.sync.set({backgroundColor: '#0099ff'});
    chrome.storage.sync.set({showSeconds: true});
    chrome.storage.sync.set({units: 'metric'});//or imperial
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