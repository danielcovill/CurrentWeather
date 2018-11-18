import WeatherDay from "./weather-day.js";

const appid = "b0f862ef54b989442647ab3a73f3d5eb";

class OpenWeatherMap {

    static getWeatherByCoords(lat, lon, units) {
        let todayUrl = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&units=" + units + "&appid=" + appid;
        let futureUrl = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&units=" + units + "&appid=" + appid;
        return this.getWeather(todayUrl, futureUrl);
 
    }

    static getWeatherByZip(zip, units) {
        let todayUrl = "https://api.openweathermap.org/data/2.5/weather?zip=" + zip + "&units=" + units + "&appid=" + appid;
        let futureUrl = "https://api.openweathermap.org/data/2.5/forecast?zip=" + zip + "&units=" + units + "&appid=" + appid;
        return this.getWeather(todayUrl, futureUrl);
    }

    // Returns array of weatherdays
    static getWeather(todayUrl, futureUrl) {
        let todayPromise = new Promise((resolve, reject) => {
            this.apiCallHandler(todayUrl, (result) => {
                resolve(new WeatherDay(
                    Date.parse(new Date()),
                    result.name,
                    result.weather[0].id,
                    result.main.temp,
                    result.main.temp_min,
                    result.main.temp_max,
                    result.weather[0].icon,
                    result.weather[0].description,
                    result.sys.sunrise,
                    result.sys.sunset,
                    result.wind.deg,
                    result.wind.speed,
                    result.wind.gust
                ));
            });
        });
        let futurePromise = new Promise((resolve, reject) => {
            this.apiCallHandler(futureUrl, (result) => {
                let d = new Date();
                let weatherDays = [];

                for(let i=0;i<4;i++) {
                    weatherDays.push(new WeatherDay(d.setDate(d.getDate() + 1), result.city.name)); 
                }

                result.list.forEach(item => {
                    let itemDate = new Date(item.dt * 1000);//forecast local time
                    let currentWeatherDay = null;
                    let i=0;
                    
                    //figure out which weatherDay this entry pertains to
                    for(let i=0;i<4;i++) {
                        if(weatherDays[i].Date.getDay() == itemDate.getDay() &&
                            weatherDays[i].Date.getMonth() == itemDate.getMonth() &&
                            weatherDays[i].Date.getYear() == itemDate.getYear()) {
                                currentWeatherDay = weatherDays[i];
                                break;
                        }
                    }

                    //if currentWeatherDay is null, the item we're looking at predicts weather 
                    //for a day we don't care about so move on
                    if(currentWeatherDay == null) { return; }

                    //compare data over time pulling extremes
                    if(!currentWeatherDay.maxTemp || currentWeatherDay.maxTemp < item.main.temp_max) {
                        currentWeatherDay.maxTemp = item.main.temp_max;
                    }
                    if(!currentWeatherDay.minTemp || currentWeatherDay.minTemp > item.main.temp_min ) {
                        currentWeatherDay.minTemp = item.main.temp_min;
                    }
                    if(!currentWeatherDay.weatherId || Number(currentWeatherDay.icon.slice(0,2)) < item.weather[0].icon.slice(0,2)) {
                        currentWeatherDay.weatherId = item.weather[0].id;
                        currentWeatherDay.icon = item.weather[0].icon;
                        currentWeatherDay.description = item.weather[0].description;
                    }
                });

                resolve(weatherDays);
            });
        });
        return Promise.all([todayPromise, futurePromise]).then((resultArray) => {
            let result = [];
            resultArray.forEach((item) => {
                result = result.concat(item);
            });
            return result;
        });
    }

    static apiCallHandler(url, callback) {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.send();

        request.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                let responseData = JSON.parse(this.responseText);
                callback(responseData);
            } else if (this.readyState == XMLHttpRequest.DONE) {
                throw this.status;
            }
        };
    }
}
export default OpenWeatherMap;