import WeatherDay from "./weather-day.js";

class Weather {

	constructor(_provider) {
		this.provider = _provider;
	}

	// Returns array of weatherdays
	async getWeather(forceRefresh) {
		const storageResult = await new Promise((resolve) => {
			chrome.storage.sync.get(['location', 'units', 'coords'], (result) => {
				resolve(result);
			});
		});

		return new Promise((resolve, reject) => {
			chrome.storage.local.get(['weatherCache'], (result) => {
				// 60min * 60sec * 1000ms = 3600000 = older than 1hr
				// 60sec * 1000ms = 60000 = older than 1min
				let dataIsStale = Object.entries(result).length === 0 || result.weatherCache.date < new Date().getTime() - 3600000;
				if (dataIsStale || forceRefresh) {
					if (storageResult.location == "" && !storageResult.coords) {
						reject("No Location Data");
					}
					else if (storageResult.location == "" && !!storageResult.coords) {
						this.provider.getWeatherByCoords(storageResult.coords.latitude, storageResult.coords.longitude, storageResult.units).then((response) => {
							chrome.storage.local.set({ weatherCache: { date: Date.now(), weather: response } }, () => {
								resolve(response);
							});
						});
					} else {
						this.provider.getWeatherByZip(storageResult.location, storageResult.units).then((response) => {
							chrome.storage.local.set({ weatherCache: { date: Date.now(), weather: response } }, () => {
								resolve(response);
							});
						});
					}
				} else {
					//get the data from the local storage and send it back 
					chrome.storage.local.get(["weatherCache"], (result) => {
						if (Object.entries(result).length === 0) {
							reject("No local weather cache");
						} else {
							let weatherDays = [];
							for(let i=0;i<result.weatherCache.weather.length;i++) {
								let day = result.weatherCache.weather[i];
								weatherDays.push(new WeatherDay(
									day.unixUtcDate
									, day.location
									, day.weatherId
									, day.currentTemp
									, day.minTemp
									, day.maxTemp
									, day.icon
									, day.description
									, day.sunriseUTC
									, day.sunsetUTC
									, day.windDirection
									, day.windSpeed
									, day.windGust
								));
							}
							resolve(weatherDays);
						}
					});
				}
			});
		});
	}
}
export default Weather;