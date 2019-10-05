class WeatherDay {
	constructor(unixUtcDate, location, weatherId, currentTemp, minTemp, maxTemp, icon, description, sunriseUTC, sunsetUTC, windDirection, windSpeeed, windGust) {
		this.unixUtcDate = unixUtcDate;
		this.location = location;
		this.weatherId = weatherId;
		this.currentTemp = currentTemp;
		this.minTemp = minTemp;
		this.maxTemp = maxTemp;
		this.icon = icon;
		this.description = description;
		this.sunriseUTC = sunriseUTC;
		this.sunsetUTC = sunsetUTC;
		this.wind = {
			direction: windDirection,
			speed: windSpeeed,
			gust: windGust
		};
	}

	get Date() {
		return new Date(this.unixUtcDate);
	}

	get FriendlyDay() {
		let d = new Date(this.unixUtcDate);
		let result = "";
		if (d.toDateString() == new Date().toDateString()) {
			result = chrome.i18n.getMessage("today");
		} else {
			result = d.toLocaleDateString(undefined, { weekday: "long" });
		}
		return result;
	}
}
export default WeatherDay;