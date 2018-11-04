import OpenWeatherMap from "./owm-weather.js";
import Weather from "./weather.js";
import Settings from "./settings.js";
const weather = new Weather(OpenWeatherMap);

document.getElementById("left-sidebar-toggle").addEventListener("click", () => {
    toggleLeftSidebar(true);
});
document.getElementById("left-sidebar-close").addEventListener("click", () => {
    toggleLeftSidebar(false);
});
document.getElementById("settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
});
document.getElementById("settingsForm").addEventListener("change", async (event) => {
    await Settings.setUserSetting(event.srcElement.name, event.srcElement.value);
    switch(event.srcElement.name) {
        case "hour":
        case "seconds":
            refreshTime();
            break;
        case "bgColor":
            await refreshColors();
            break;
        case "zip":
        case "units":
            const weatherData = weather.getWeather();
            setWeatherLoading(true);
            refreshWeather(await weatherData);
            setWeatherLoading(false);
            break;
    }
});

initializeApplication();

async function initializeApplication() {
    setInterval(refreshTime, 1000);

    // Initialize settings
    await Settings.initializeSettings(false);
    const weatherData = weather.getWeather();
    
    // Set up UI and refresh necessary UI elements
    toggleLeftSidebar(location.hash=="#settings");
    await Promise.all([
        refreshSettingsPane(),
        refreshColors(),
        refreshTime()
    ]);
    refreshDate();
    setWeatherLoading(true);
    refreshWeather(await weatherData);
    setWeatherLoading(false);
}

function displayError(message) {
    document.querySelector(".errorMessage").innerHTML = message;
}

async function refreshColors() {
    const backgroundColorResult = await new Promise((resolve) => { 
        chrome.storage.sync.get(['backgroundColor'], (result) => {
            resolve(result);
        });
    });

    document.body.style.backgroundColor = backgroundColorResult.backgroundColor;
    let backgroundIsDark = Settings.isColorDark(backgroundColorResult.backgroundColor)

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

}

function setWeatherLoading(showIcon) {
    if(showIcon) { 
        document.querySelector(".weather>.loading").style.opacity = "1";
        document.querySelector(".weather>.forecast").style.opacity = "0";
    } else {
        document.querySelector(".weather>.loading").style.opacity = "0";
        document.querySelector(".weather>.forecast").style.opacity = "1";
    }
}

function refreshWeather(data) {
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
    document.querySelector(".content>.location").classList.remove("hide");
    document.querySelector(".content>.location").classList.add("show");
    document.querySelectorAll(".content>.weather>.forecast>.day").forEach((element) => {
        element.classList.remove("hide");
        element.classList.add("show");
    });
}

function refreshDate() {
    document.querySelector(".date").innerHTML = formatDate(new Date());
}

async function refreshTime() {
    const syncResult = await new Promise((resolve) => {
        chrome.storage.sync.get(['clockVersion','showSeconds'], (result) => {
            resolve(result);
        });
    });
    let dateTime = new Date();
    let hours = 0;
    let ampm = "";
    if(syncResult.clockVersion == 24) {
        hours = padDigits(dateTime.getHours());
    } else {
        hours = dateTime.getHours() % 12;
        if(hours == 0) { hours = 12; }
        ampm = dateTime.getHours() > 11 ? "PM" : "AM";
    }
    if(dateTime.getHours() == 0 && dateTime.getMinutes() == 0 && dateTime.getSeconds() == 0) {
        refreshDate(formatDate(new Date()));
    }
    document.querySelector(".hour").innerHTML = hours;
    document.querySelector(".am-pm").innerHTML = ampm;
    document.querySelector(".minute").innerHTML = padDigits(dateTime.getMinutes());
    document.querySelector(".second").innerHTML = syncResult.showSeconds ? padDigits(dateTime.getSeconds()) : "";
}

function toggleLeftSidebar(showSidebar) {
    if(showSidebar) {
        document.querySelector(".menu-icon").style.visibility = "hidden";
        document.querySelector(".left-sidebar").classList.remove("hide");
        document.querySelector(".left-sidebar").classList.add("show");
    } else {
        document.querySelector(".left-sidebar").classList.remove("show");
        document.querySelector(".left-sidebar").classList.add("hide");
        document.querySelector(".menu-icon").style.visibility = "visible";
    }
}

function formatDate(jsDate) {
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

async function refreshSettingsPane() {
    const settingsResult = await new Promise((resolve) => {
        chrome.storage.sync.get([
            'clockVersion',
            'location',
            'dateFormat',
            'backgroundColor',
            'showSeconds',
            'units'
        ], (result) => {
            resolve(result);
        });
    });
    if (settingsResult.clockVersion == 12) {
        document.getElementById("hourRadio12").setAttribute("checked", "checked");
        document.getElementById("hourRadio24").removeAttribute("checked");
    }
    else {
        document.getElementById("hourRadio24").setAttribute("checked", "checked");
        document.getElementById("hourRadio12").removeAttribute("checked");
    }
    document.getElementById("zipInput").setAttribute("value", settingsResult.location);
    if (settingsResult.showSeconds) {
        document.getElementById("secondsRadioOn").setAttribute("checked", "checked");
        document.getElementById("secondsRadioOff").removeAttribute("checked");
    }
    else {
        document.getElementById("secondsRadioOff").setAttribute("checked", "checked");
        document.getElementById("secondsRadioOn").removeAttribute("checked");
    }
    if (settingsResult.units == "metric") {
        document.getElementById("unitsRadioMetric").setAttribute("checked", "checked");
        document.getElementById("unitsRadioImperial").removeAttribute("checked");
    }
    else {
        document.getElementById("unitsRadioImperial").setAttribute("checked", "checked");
        document.getElementById("unitsRadioMetric").removeAttribute("checked");
    }
    document.getElementById("colorPicker").setAttribute("value", settingsResult.backgroundColor);
}