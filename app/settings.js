class Settings { 

    static async initializeSettings(forceReset) {
        if(forceReset) {
            await this.setDefaultUserSettings();
        } else {
            await new Promise((resolve) => {
                chrome.storage.sync.get(['initialized'], (result) => {
                    if(!result.initialized) {
                        resolve(this.setDefaultUserSettings());
                    } else {
                        resolve();
                    }
                });
            });
        }
    }

    static storageToConsole() {
        chrome.storage.sync.get(null, function(items) {
            var allKeys = Object.keys(items);
            console.log(allKeys);
        });
    }

    static async setDefaultUserSettings() {
        return Promise.all([
            new Promise((resolve) => {
                chrome.storage.sync.set({initialized: true}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({clockVersion: '12'}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({location: ''}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({dateFormat: 'US'}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({primaryFontColor: '#EEEEEE'}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({secondaryFontColor: '#666666'}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({backgroundColor: '#005493'}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({autoFontColor: true}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({showSeconds: true}, () => {
                    resolve();
                });
            }),
            new Promise((resolve) => {
                chrome.storage.sync.set({units: 'metric'}, () => {
                    resolve();
                });
            })
        ]);
    }

    static async refreshCoordinates() {
        const position = await new Promise((resolve) => { 
            navigator.geolocation.getCurrentPosition((result) => {
                resolve(result);
            }, 
            (error) => {
                reject(error);
            });
        }).catch((error) => {
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
            return;
        });
    
        const coords = { latitude: position.coords.latitude.toString(), longitude: position.coords.longitude.toString() };
        return new Promise((resolve) => {
            chrome.storage.sync.set({coords: coords}, () => {
                resolve(coords);
            });
        });
    }

    static async setUserSetting(setting, value) {
        let settingPromise;
        switch(setting) {
            case "hour":
                settingPromise = new Promise((resolve, reject) => {
                    if(value == 12 || value == 24) {
                        chrome.storage.sync.set({clockVersion: value}, () => {
                            resolve();
                        });
                    } else {
                        reject("error_invalid_setting_option");
                    }
                });
                break;
            case "seconds":
                settingPromise = new Promise((resolve, reject) => {
                    if(value === "on" || value === "off") {
                        chrome.storage.sync.set({showSeconds: (value === "on")}, () => {
                            resolve();
                        });
                    } else {
                        reject("error_invalid_setting_option");
                    }
                });
                break;
            case "zip":
                if(value === "") {
                    this.refreshCoordinates();
                }
                settingPromise = new Promise((resolve) => {
                    chrome.storage.sync.set({location: value}, () => {
                        resolve();
                    });
                });
                break;
            case "units":
                settingPromise = new Promise((resolve, reject) => {
                    if(value === "metric" || value === "imperial") {
                        chrome.storage.sync.set({units: value}, () => {
                            resolve();
                        });
                    } else {
                        reject("error_invalid_setting_option");
                    }
                });
                break;
            case "bgColor":
                settingPromise = new Promise((resolve) => {
                    chrome.storage.sync.set({backgroundColor: value}, () => {
                        resolve();
                    });
                });
                break;
            case "pfColor":
                settingPromise = new Promise((resolve) => {
                    chrome.storage.sync.set({primaryFontColor: value}, () => {
                        resolve();
                    });
                });
                break;
            case "sfColor":
                settingPromise = new Promise((resolve) => {
                    chrome.storage.sync.set({secondaryFontColor: value}, () => {
                        resolve();
                    });
                });
                break;
            case "autofontcolor":
                settingPromise = new Promise((resolve) => {
                    chrome.storage.sync.set({autoFontColor: (value == "on")}, () => {
                        resolve();
                    });
                });
                break;
         default:
                settingPromise = Promise.reject("error_invalid_setting");
                break;
        }
        return settingPromise;
    }

    static isColorDark(rgbHex) {
        let rgbvals = [
            parseInt(rgbHex.slice(1,3), 16), 
            parseInt(rgbHex.slice(3,5), 16), 
            parseInt(rgbHex.slice(5,7), 16)
        ];
        let isDark = (1 - (0.299 * rgbvals[0] + 0.587 * rgbvals[1] + 0.114 * rgbvals[2]) / 255) > .5;
        return isDark;
    }
    
}
export default Settings;