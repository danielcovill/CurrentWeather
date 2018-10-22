import OpenWeatherMap from "./owm-weather.js";

let userSettings = {};
let coords = null;

document.getElementById("left-sidebar-toggle").addEventListener("click", () => {
    document.querySelector(".left-sidebar").classList.add("show");
    document.querySelector(".left-sidebar").classList.remove("hide");
});
document.getElementById("left-sidebar-close").addEventListener("click", () => {
    document.querySelector(".left-sidebar").classList.remove("show");
    document.querySelector(".left-sidebar").classList.add("hide");
});

// Check if it's their first time running the app (or if their settings were nuked)
// and set them up with defaults if necessary
chrome.storage.sync.get(['initialized'], (result) => {
    if(!!result) {
        setDefaultUserSettings();
    }
});

// Load initial state
refreshLeftSidebar(location.hash=="#settings");

// Get their settings out of storage (which refreshes views)
pullUserSettings(); 

// Set in motion regular checks to update the clock and the weather
let clockTick = setInterval(refreshTime, 1000);
let weatherTick = setInterval(refreshWeather, 3600000);

function displayError(message) {
    document.querySelector(".errorMessage").innerHTML = message;
}

function setDisplayPreferences() {
    document.body.style.backgroundColor = userSettings.backgroundColor;

    // Based on the background color, pick light or dark text
    let bodyrgb = window.getComputedStyle(document.body).backgroundColor
    let bodyrgbvals = bodyrgb.slice(4,bodyrgb.length-1).split(',');
    let backgroundIsDark = (1 - (0.299 * bodyrgbvals[0] + 0.587 * bodyrgbvals[1] + 0.114 * bodyrgbvals[2]) / 255) > .5;
    let loadingBars = document.getElementsByClassName("loading-bar");
    if(backgroundIsDark) {
        document.body.classList.add("light");
        document.body.classList.remove("dark");
        for(let i=0;i<loadingBars.length;i++) {
            loadingBars[i].classList.add("light");
            loadingBars[i].classList.remove("dark");
        }
    } else {
        document.body.classList.add("dark");
        document.body.classList.remove("light");
        for(let i=0;i<loadingBars.length;i++) {
            loadingBars[i].classList.add("dark");
            loadingBars[i].classList.remove("light");
        }
    }
    document.getElementById("colorPicker").value = rgbtohex(bodyrgb);
}

function setWeatherLoading(showIcon) {
    if(showIcon) { 
        document.querySelector(".weather>.loading").style.display = "block";
        document.querySelector(".weather>.forecast").style.display = "none";
    } else {
        document.querySelector(".weather>.loading").style.display = "none";
        document.querySelector(".weather>.forecast").style.display = "flex";
    }
}

function refreshWeather() {
    setWeatherLoading(true);
    switch(userSettings.location) {
        case "auto":
            if(coords == null) {
                refreshCoordinates(() => {
                    OpenWeatherMap.getWeatherByCoords(coords.latitude, coords.longitude, userSettings.units).then((response) => {
                        showWeatherData(response);
                    });
                });
            } else {
                OpenWeatherMap.getWeatherByCoords(coords.latitude, coords.longitude, userSettings.units).then((response) => {
                    showWeatherData(response);
                });
            }
            break;
        case "zip":
            //FIXME: Remove the hardcoded zip for testing
            OpenWeatherMap.getWeatherByZip("80204", (response) => {
                showWeatherData(response);
            });
            break;
        default:
            displayError(chrome.i18n.getMessage("error_location_variable"));
            setWeatherLoading(false);
            break;
    }
}

function showWeatherData(data) {
    let markupDays = document.getElementsByClassName("day");
    for(let i=0;i<markupDays.length;i++) {
        if(!!data[i].weatherId) {
            markupDays[i].querySelector(".wi").classList.add("wi-owm-" + data[i].weatherId);
        }
        //if it's "now" we don't show min/max
        let tempContainer = markupDays[i].querySelector(".temp");
        let currentTemp = tempContainer.querySelector(".current");
        let maxTemp = tempContainer.querySelector(".maxtemp");
        let minTemp = tempContainer.querySelector(".mintemp");

        if(!!data[i].unixUtcDate && new Date().toDateString() === new Date(data[i].unixUtcDate).toDateString()) {
            currentTemp.style.display = "inline";
            maxTemp.style.display = "none";
            minTemp.style.display = "none";
            currentTemp.innerHTML = Math.round(data[i].currentTemp);
        } else {
            currentTemp.style.display = "none";
            maxTemp.style.display = "inline";
            minTemp.style.display = "inline";
            maxTemp.innerHTML = Math.round(data[i].maxTemp);
            minTemp.innerHTML = Math.round(data[i].minTemp);
        }
        markupDays[i].querySelector(".dayName").innerHTML = data[i].FriendlyDay;
    }
    document.querySelector(".content>.location").innerHTML = data[0].location;
    setWeatherLoading(false);
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
    document.querySelector(".date").innerHTML = formatDate(new Date());
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
    if(d.getHours() == 0 && d.getMinutes() == 0 && d.getSeconds() == 0) {
        refreshDate();
    }
    document.querySelector(".hour").innerHTML = hours;
    document.querySelector(".am-pm").innerHTML = ampm;
    document.querySelector(".minute").innerHTML = padDigits(d.getMinutes());
    document.querySelector(".second").innerHTML = 
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
    chrome.storage.sync.set({clockVersion: '24'});
    chrome.storage.sync.set({location: 'auto'});
    chrome.storage.sync.set({dateFormat: 'US'});
    chrome.storage.sync.set({backgroundColor: '#aaaaaa'});
    //chrome.storage.sync.set({backgroundColor: '#0099ff'});
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

function rgbtohex(rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
     ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
     ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
     ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}

function refreshLeftSidebar(showSidebar) {
    if(showSidebar) {
        document.querySelector(".left-sidebar").classList.add("show");
        document.querySelector(".left-sidebar").classList.remove("hide");
    } else {
        document.querySelector(".left-sidebar").classList.add("hide");
        document.querySelector(".left-sidebar").classList.remove("show");
    }
}