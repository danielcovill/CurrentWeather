class WeatherDay {
    constructor(unixUtcDate, location, weatherId, currentTemp, minTemp, maxTemp, icon, description, windDirection, windSpeeed, windGust) {
        this.unixUtcDate = unixUtcDate;
        this.location = location;
        this.weatherId = weatherId;
        this.currentTemp = currentTemp;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.icon = icon;
        this.description = description;
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
        if(d.toDateString() == new Date().toDateString()) {
            result = "current";
        } else {
            switch(d.getDay()) {
                case 0:
                    result = "sun";
                    break;
                case 1:
                    result = "mon";
                    break;
                case 2:
                    result = "tue";
                    break;
                case 3:
                    result = "wed";
                    break;
                case 4:
                    result = "thu";
                    break;
                case 5:
                    result = "fri";
                    break;
                case 6:
                    result = "sat";
                    break;
            }
        }
        return chrome.i18n.getMessage(result);
    }
}
export default WeatherDay;