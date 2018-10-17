const appid = "b0f862ef54b989442647ab3a73f3d5eb";

class OpenWeatherMap {
    static getCurrentWeatherByCoords(lat, lon, units, callback) {
        let url = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&units=" + units + "&appid=" + appid;
        this.apiCallHandler(url, callback);
    }

    static getCurrentWeatherByZip(zip, units, callback) {
        let url = "https://api.openweathermap.org/data/2.5/weather?zip=" + zip + "&units=" + units + "&appid=" + appid;
        this.apiCallHandler(url, callback);
    }

    static apiCallHandler(url, callback) {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.send();

        request.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                let response = JSON.parse(this.responseText);
                callback(response);
            }
        };
    }
}
export default OpenWeatherMap;