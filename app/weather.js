import Settings from "./settings.js";

class Weather {

    constructor(_provider) {
        this.provider = _provider;
    }

    // Returns array of weatherdays
    async getWeather() {
        const storageResult = await new Promise((resolve) => {
            chrome.storage.sync.get(['location','units','coords'], (result) => {
                resolve(result);
            });
        });

        if(storageResult.location == "" && !storageResult.coords) {
            await Settings.refreshCoordinates();
        }
    
        const weatherResult = await new Promise((resolve) => {
            if(storageResult.location == "" && !!storageResult.coords) {
                this.provider.getWeatherByCoords(storageResult.coords.latitude, storageResult.coords.longitude, storageResult.units).then((response) => {
                    resolve(response);
                });
            } else {
                this.provider.getWeatherByZip(storageResult.location, storageResult.units).then((response) => {
                    resolve(response);
                });
            } 
        });

        return weatherResult;
    }

}
export default Weather;
