import OpenWeatherMap from "./owm-weather.js";
import Weather from "./weather.js";
import Settings from "./settings.js";
const weather = new Weather(OpenWeatherMap);
let fontOptions = [];

document.getElementById("left-sidebar-toggle").addEventListener("click", async () => {
	toggleLeftSidebar(true);
});
document.getElementById("left-sidebar-close").addEventListener("click", () => {
	toggleLeftSidebar(false);
});
document.getElementById("primary-content").addEventListener("click", () => {
	toggleLeftSidebar(false);
});
document.getElementById("settingsForm").addEventListener("submit", async (event) => {
	event.preventDefault();
});
document.getElementById("settingsForm").addEventListener("change", async (event) => {
	let weatherData;
	await Settings.setUserSetting(event.srcElement.name, event.srcElement.value);
	switch (event.srcElement.name) {
		case "hour":
		case "seconds":
			refreshTime();
			break;
		case "autofontcolor":
		case "background":
			try {
				weatherData = await weather.getWeather();
				await updateSolarMovement(weatherData);
			} catch (err) {
				console.log("Can not refresh data: " + err)
			}
			await Promise.all([
				refreshSettingsPane(),
				refreshColors()
			]);
			break;
		case "bgColor":
		case "pfColor":
		case "sfColor":
			await refreshColors();
			break;
		case "zip":
		case "units":
			try {
				weatherData = await weather.getWeather(true);
				await updateSolarMovement(weatherData);
				refreshWeather(weatherData);
			} catch (err) {
				console.log("Can not refresh data: " + err)
			}
			break;
		case "font":
			await updateFont();
			break;
		default:
			break;
	}
});

initializeApplication();
async function initializeApplication() {
	await Settings.SetDefaultUserSettings(false);
	await Promise.all([
		refreshColors(),
		updateFont(),
		setNotesAlert()
	]);
	refreshTime();
	refreshDate();
	setInterval(refreshTime, 1000);

	if(location.hash == "#settings") {
		toggleLeftSidebar(true);
	}

	let weatherData = await weather.getWeather()
	.catch((err) => {
		if (err === "No Location Data") {
			//this is here because chrome now requires interaction before you grab location
			//on first run they've never interacted so we show the side bar so they'll at least
			//have to close it (our interaction) allowing us to grab coords and update weather info
			document.getElementById("weatherLoading").classList.add("loading");
			toggleLeftSidebar(true);
		}
	});
	if (!!weatherData) {
		await updateSolarMovement(weatherData);
		refreshWeather(weatherData);
	}

	// Set up UI and refresh necessary UI elements. Colors get refreshed in case the weather
	// update changed time of day color stuff
	await Promise.all([
		refreshSettingsPane(),
		refreshColors()
	]);
}

async function updateFont() {


	const fontResult = await new Promise((resolve) => {
		chrome.storage.sync.get(['font'], (result) => {
			resolve(result);
		});
	});

	if(!fontResult.font) {
		document.body.style.fontFamily = "HelveticaNeueUltraLight";
	} else {
		document.getElementById("fontDownload").href = `https://fonts.googleapis.com/css2?family=${fontResult.font.replace(/ /g, '+')}`;
		document.body.style.fontFamily = fontResult.font;
	}
}

async function setNotesAlert() {
	const notesVersion = await new Promise((resolve) => {
		chrome.storage.sync.get(['appNotesVersion'], (result) => {
			resolve(result.appNotesVersion);
		});
	});
	if(notesVersion !== chrome.runtime.getManifest().version) {
		document.getElementById('left-sidebar-toggle').classList.add('blink');
	}
}

async function updateSolarMovement(weather) {
	const sunrise = new Date(weather[0].sunrise);
	const sunset = new Date(weather[0].sunset);
	return Promise.all([
		Settings.setUserSetting("sunrise", sunrise),
		Settings.setUserSetting("sunset", sunset)
	]);
}

async function refreshColors() {
	const colorResult = await new Promise((resolve) => {
		chrome.storage.sync.get(['background', 'backgroundColor', 'autoFontColor', 'primaryFontColor', 'secondaryFontColor'], (result) => {
			resolve(result);
		});
	});

	if (colorResult.background == "manual") {
		document.body.style.background = colorResult.backgroundColor;
	} else if (colorResult.background == "tod") {
		const today = new Date();
		const sunrise = new Date();
		sunrise.setHours(6);
		sunrise.setMinutes(0);
		const sunset = new Date();
		sunset.setMinutes(0);
		sunset.setHours(17);
		document.body.style.background = Settings.getDaytimeColor(today, sunrise, sunset);
	}

	let primaryColorNodes = document.getElementsByClassName('primaryColor');
	let secondaryColorNodes = document.getElementsByClassName('secondaryColor');
	let icons = document.querySelectorAll('.menu-icon, #weatherLoading .loading-bar');
	let primaryColor;
	let secondaryColor;

	if (colorResult.autoFontColor) {
		if (Settings.isColorDark(colorResult.backgroundColor)) {
			primaryColor = "#EEE";
			secondaryColor = "#BBB";
		} else {
			primaryColor = "#333";
			secondaryColor = "#555";
		}
	} else {
		primaryColor = colorResult.primaryFontColor;
		secondaryColor = colorResult.secondaryFontColor;
	}

	for (let i = 0; i < primaryColorNodes.length; i++) {
		primaryColorNodes[i].style.color = primaryColor;
	}
	for (let i = 0; i < secondaryColorNodes.length; i++) {
		secondaryColorNodes[i].style.color = secondaryColor;
	}
	for (let i = 0; i < icons.length; i++) {
		icons[i].style.backgroundColor = primaryColor;
	}
}

function refreshWeather(data) {
	let markupDays = document.getElementsByClassName("day");
	for (let i = 0; i < markupDays.length; i++) {
		if (!!data[i].weatherId) {
			markupDays[i].querySelector(".wi").classList.add("wi-owm-" + data[i].weatherId);
		}
		//if it's "now" we don't show min/max
		let tempContainer = markupDays[i].querySelector(".temp");
		let currentTemp = document.querySelector(".currentTemp");
		let maxTemp = tempContainer.querySelector(".maxtemp");
		let minTemp = tempContainer.querySelector(".mintemp");

		if (!!data[i].unixUtcDate && new Date().toDateString() === new Date(data[i].unixUtcDate).toDateString()) {
			currentTemp.innerHTML = chrome.i18n.getMessage("currently") + ": " + Math.round(data[i].currentTemp);
			currentTemp.classList.add("currentTempLoaded");
			document.title = chrome.i18n.getMessage("currently") + ": " + Math.round(data[i].currentTemp) + String.fromCharCode(176);
		}
		maxTemp.style.display = "inline";
		minTemp.style.display = "inline";
		maxTemp.innerHTML = Math.round(data[i].maxTemp);
		minTemp.innerHTML = Math.round(data[i].minTemp);
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
	document.querySelector(".date").innerHTML = new Date().toLocaleDateString(undefined, { dateStyle: "full" });
}

async function refreshTime() {
	const syncResult = await new Promise((resolve) => {
		chrome.storage.sync.get(['clockVersion', 'showSeconds'], (result) => {
			resolve(result);
		});
	});
	let dateTime = new Date();
	let time = dateTime.toLocaleTimeString(undefined, {
		hour12: syncResult.clockVersion == 12 || syncResult.clockVersion == undefined,
		hour: syncResult.clockVersion == 12 || syncResult.clockVersion == undefined ? "numeric" : "2-digit",
		minute: "2-digit",
		second: syncResult.showSeconds || syncResult.showSeconds == undefined ? "2-digit" : undefined
	}).replace(/\./g, "").toUpperCase();

	if (dateTime.getHours() == 0 && dateTime.getMinutes() == 0 && dateTime.getSeconds() == 0) {
		refreshDate();
	}
	document.querySelector(".time").innerHTML = time;
}

async function toggleLeftSidebar(showSidebar) {
	if (showSidebar) {
		//set the font picker up for loading
		document.getElementById("fontPicker").style.display = "none";
		document.getElementById("fontLoading").classList.add("loading");
		//show/hide the necessary controls
		document.querySelector(".menu-icon").style.visibility = "hidden";
		document.querySelector(".left-sidebar").classList.remove("hide");
		document.querySelector(".left-sidebar").classList.add("show");
		//highlight new settings if we're in "new settings" mode
		if(document.getElementById("left-sidebar-toggle").classList.contains("blink")) {
			document.getElementsByClassName("fontSelection")[0].classList.add("new");
		}
		//load font options datalist
		if(fontOptions.length === 0) {
			const response = await fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyC5yzJ5rXCvKU2VgjGdbdlUHIvIHoTuPNw');
			fontOptions = (await response.json()).items.map(a => a.family);
			let fontPickerList = document.getElementById('fontPickerList');
			fontOptions.forEach(fontOption => {
				let option = document.createElement('option');
				option.value = fontOption;
				fontPickerList.appendChild(option);
			});
		} 
		//once things are loaded, bring the font picker back
		document.getElementById("fontLoading").classList.remove("loading");
		document.getElementById("fontPicker").style.display = "block";
	} else {
		//pull the hash so refreshing won't keep opening settings
		location.hash = "";
		//update the version setting to keep from repeatedly saying "new version"
		await Settings.setUserSetting("appNotesVersion", chrome.runtime.getManifest().version);
		//stop the new version animations
		document.getElementById('left-sidebar-toggle').classList.remove('blink');
		document.getElementsByClassName("fontSelection")[0].classList.remove("new");
		//hide the sidebar
		document.querySelector(".left-sidebar").classList.remove("show");
		document.querySelector(".left-sidebar").classList.add("hide");
		document.querySelector(".menu-icon").style.visibility = "visible";
		//update user coordinates from user settings and if they don't have any, request from browser
		const coordsResult = await new Promise((resolve) => {
			chrome.storage.sync.get(['coords'], (result) => {
				resolve(result);
			});
		});
		if(!coordsResult.coords) {
			await Settings.refreshCoordinates();
		}
		//refresh weather data
		try {
			let weatherData = await weather.getWeather(true);
			await updateSolarMovement(weatherData);
			refreshWeather(weatherData);
		} catch (err) {
			console.error("Can not refresh data: " + err)
		} finally {
			document.getElementById("weatherLoading").classList.remove("loading");
		}
	}
}

async function refreshSettingsPane() {
	const settingsResult = await new Promise((resolve) => {
		chrome.storage.sync.get([
			'clockVersion',
			'location',
			'background',
			'backgroundColor',
			'autoFontColor',
			'primaryFontColor',
			'secondaryFontColor',
			'showSeconds',
			'units',
			'font'
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
	switch (settingsResult.background) {
		case "manual":
			document.getElementById("autoBgManual").setAttribute("checked", "checked");
			document.getElementById("autoBgTod").removeAttribute("checked");
			document.getElementById("bgColors").style.display = "block";
			break;
		case "tod":
			document.getElementById("autoBgTod").setAttribute("checked", "checked");
			document.getElementById("autoBgManual").removeAttribute("checked");
			document.getElementById("bgColors").style.display = "none";
			break;
		default:
			break;
	}
	if (settingsResult.autoFontColor) {
		document.getElementById("autoFontOn").setAttribute("checked", "checked");
		document.getElementById("autoFontOff").removeAttribute("checked");
		document.getElementById("fontColors").style.display = "none";
	} else {
		document.getElementById("autoFontOff").setAttribute("checked", "checked");
		document.getElementById("autoFontOn").removeAttribute("checked");
		document.getElementById("fontColors").style.display = "block";
	}
	document.getElementById("zipInput").setAttribute("value", settingsResult.location);
	document.getElementById("bgColorPicker").setAttribute("value", settingsResult.backgroundColor);
	document.getElementById("pfColorPicker").setAttribute("value", settingsResult.primaryFontColor);
	document.getElementById("sfColorPicker").setAttribute("value", settingsResult.secondaryFontColor);
	document.getElementById("fontPicker").setAttribute("value", settingsResult.font);
}
