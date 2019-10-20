class Settings {

	static storageToConsole() {
		chrome.storage.sync.get(null, function (items) {
			var allKeys = Object.keys(items);
			console.log(allKeys);
		});
	}

	static getDaytimeColor(forTime, sunrise, sunset) {
		const forTimeSecs = this.getSecondsSinceMidnight(forTime);
		const sunriseSecs = this.getSecondsSinceMidnight(sunrise);
		const sunsetSecs = this.getSecondsSinceMidnight(sunset);
		let h1;
		let h2;
		let l1;
		let l2;

		let pctDaylight;
		if (forTimeSecs < sunriseSecs) {
			pctDaylight = 1 - ((sunriseSecs - forTimeSecs) / 3600);
		} else if (forTimeSecs > sunsetSecs) {
			pctDaylight = 1 - ((forTimeSecs - sunsetSecs) / 3600);
		} else {
			pctDaylight = 1;
		}
		if (pctDaylight < 0) { pctDaylight = 0; }

		//509.4161022 x3 - 1074.741378 x2 + 738.7242538 x - 125.8247358
		h1 = this.trueMod((-125
			+ 738.72 * pctDaylight
			- 1074.74 * Math.pow(pctDaylight, 2)
			+ 509.416 * Math.pow(pctDaylight, 3)), 360);
		//27.99005594 x3 - 66.9289297 x2 + 16.125988 x + 239.6656059
		h2 = this.trueMod((239.66
			+ 16.13 * pctDaylight
			- 66.93 * Math.pow(pctDaylight, 2)
			+ 27.99 * Math.pow(pctDaylight, 3)), 360);
		//-124.0724476 x3 + 207.6429693 x2 + 6.377867973 x + 13.16696641
		l1 = 13.17
			+ 6.38 * pctDaylight
			+ 207.64 * Math.pow(pctDaylight, 2)
			- 124.07 * Math.pow(pctDaylight, 3);
		//-165.5058045 x3 + 291.8064645 x2 - 85.66511939 x + 18.1578807
		l2 = 18.16
			- 85.66 * pctDaylight
			+ 291.81 * Math.pow(pctDaylight, 2)
			- 165.50 * Math.pow(pctDaylight, 3);

		return `linear-gradient(0deg, hsl(${h1}, 100%, ${l1}%) 0%, hsl(${h2}, 100%, ${l2}%) 100%)`;
	}


	//rather than using the initialized field, I think what I'm going to do is just manually check all the settings
	static async SetDefaultUserSettings(forceReset) {
		let settingsResult = await new Promise((resolve) => {
			chrome.storage.sync.get([
				'clockVersion',
				'location',
				'background',
				'backgroundColor',
				'autoFontColor',
				'primaryFontColor',
				'secondaryFontColor',
				'showSeconds',
				'units'
			], (result) => {
				resolve(result);
			});
		});
		return Promise.all([
			new Promise((resolve) => {
				if(forceReset || settingsResult.clockVersion === undefined) {
					chrome.storage.sync.set({ clockVersion: '12' }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			}),
			new Promise((resolve) => {
				if(forceReset || settingsResult.location === undefined) {
					chrome.storage.sync.set({ location: '' }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			}),
			new Promise((resolve) => {
				if(forceReset || settingsResult.primaryFontColor === undefined) {
					chrome.storage.sync.set({ primaryFontColor: '#EEEEEE' }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			}),
			new Promise((resolve) => {
				if(forceReset || settingsResult.secondaryFontColor === undefined) {
					chrome.storage.sync.set({ secondaryFontColor: '#666666' }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			}),
			new Promise((resolve) => {
				if(forceReset || settingsResult.background === undefined ) {
					chrome.storage.sync.set({ background: 'manual' }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			}),
			new Promise((resolve) => {
				if(forceReset || settingsResult.backgroundColor === undefined) {
					chrome.storage.sync.set({ backgroundColor: '#005493' }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			}),
			new Promise((resolve) => {
				if(forceReset || settingsResult.autoFontColor === undefined) {
					chrome.storage.sync.set({ autoFontColor: true }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			}),
			new Promise((resolve) => {
				if(forceReset || settingsResult.showSeconds === undefined) {
					chrome.storage.sync.set({ showSeconds: true }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			}),
			new Promise((resolve) => {
				if(forceReset || settingsResult.units === undefined) {
					chrome.storage.sync.set({ units: 'metric' }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			})
		]);
	}

	static async refreshCoordinates() {
		const position = await new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition((result) => {
				resolve(result);
			},
				(error) => {
					reject(error);
				});
		}).catch((error) => {
			switch (error.code) {
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
			chrome.storage.sync.set({ coords: coords }, () => {
				resolve(coords);
			});
		});
	}

	static async setUserSetting(setting, value) {
		let settingPromise;
		switch (setting) {
			case "hour":
				settingPromise = new Promise((resolve, reject) => {
					if (value == 12 || value == 24) {
						chrome.storage.sync.set({ clockVersion: value }, () => {
							resolve();
						});
					} else {
						reject("error_invalid_setting_option");
					}
				});
				break;
			case "seconds":
				settingPromise = new Promise((resolve, reject) => {
					if (value === "on" || value === "off") {
						chrome.storage.sync.set({ showSeconds: (value === "on") }, () => {
							resolve();
						});
					} else {
						reject("error_invalid_setting_option");
					}
				});
				break;
			case "zip":
				if (value === "") {
					this.refreshCoordinates();
				}
				settingPromise = new Promise((resolve) => {
					chrome.storage.sync.set({ location: value }, () => {
						resolve();
					});
				});
				break;
			case "units":
				settingPromise = new Promise((resolve, reject) => {
					if (value === "metric" || value === "imperial") {
						chrome.storage.sync.set({ units: value }, () => {
							resolve();
						});
					} else {
						reject("error_invalid_setting_option");
					}
				});
				break;
			case "background":
				settingPromise = new Promise((resolve) => {
					chrome.storage.sync.set({ background: value }, () => {
						resolve();
					});
				});
				break;
			case "bgColor":
				settingPromise = new Promise((resolve) => {
					chrome.storage.sync.set({ backgroundColor: value }, () => {
						resolve();
					});
				});
				break;
			case "pfColor":
				settingPromise = new Promise((resolve) => {
					chrome.storage.sync.set({ primaryFontColor: value }, () => {
						resolve();
					});
				});
				break;
			case "sfColor":
				settingPromise = new Promise((resolve) => {
					chrome.storage.sync.set({ secondaryFontColor: value }, () => {
						resolve();
					});
				});
				break;
			case "autofontcolor":
				settingPromise = new Promise((resolve) => {
					chrome.storage.sync.set({ autoFontColor: (value == "on") }, () => {
						resolve();
					});
				});
				break;
			case "sunrise":
				settingPromise = new Promise((resolve) => {
					chrome.storage.sync.set({ sunrise: value }, () => {
						resolve();
					});
				});
				break;
			case "sunset":
				settingPromise = new Promise((resolve) => {
					chrome.storage.sync.set({ sunset: value }, () => {
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

	static isColorDark(inputColor) {
		let colors = [];
		let colorLumocities = [];
		// is it a gradient? If so, split it up and average the results 
		// (note that this is just an average and doesn't weight for color stops)
		if (inputColor.includes("gradient")) {
			inputColor = inputColor.substring(inputColor.indexOf("(") + 1, inputColor.lastIndexOf(")"));
			colors = inputColor.split(/,(?![^(]*\))(?![^"']*["'](?:[^"']*["'][^"']*["'])*[^"']*$)/);
			colors.shift();
		} else {
			colors.push(inputColor);
		}

		colors.forEach((color) => {
			color = color.trim();
			if (color.startsWith("#")) {
				colorLumocities.push(this.computeLumocity(
					parseInt(color.slice(1, 3), 16),
					parseInt(color.slice(3, 5), 16),
					parseInt(color.slice(5, 7), 16)
				));
			} else if (color.startsWith("rgb")) {
				color = color.substring(color.indexOf("(") + 1, color.indexOf(")")).split(",");
				colorLumocities.push(this.computeLumocity(
					color[0],
					color[1],
					color[2]
				));
			} else if (color.startsWith("hsl")) {
				color = color.substring(color.indexOf("(") + 1, color.indexOf(")")).split(",");
				let rgb = hslToRgb(color[0],
					color[1].slice(0, color[1].length - 1),
					color[2].slice(0, color[2].length - 1));
				colorLumocities.push(this.computeLumocity(
					rgb[0], rgb[1], rgb[2]
				));
			}
		});

		let averageLumocity = 0;
		if (colorLumocities.length > 1) {
			colorLumocities.forEach((lumocity) => {
				averageLumocity += (lumocity - .15);
			});
			averageLumocity /= colorLumocities.length;
		} else {
			averageLumocity = colorLumocities[0];
		}
		return averageLumocity <= .5;
	}
	static hslToRgb(h, s, l) {
		let r, g, b;
		if (s == 0) {
			r = g = b = l; // achromatic
		} else {
			let hue2rgb = function hue2rgb(p, q, t) {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1 / 6) return p + (q - p) * 6 * t;
				if (t < 1 / 2) return q;
				if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			}
			let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			let p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}

	static computeLumocity(r, g, b) {
		return ((0.299 * r + 0.587 * g + 0.114 * b) / 255);
	}

	static getSecondsSinceMidnight(time) {
		return (time - new Date(time.getFullYear(), time.getMonth(), time.getDate())) / 1000;
	}

	static trueMod(value, n) {
		return ((value % n) + n) % n;
	}

}
export default Settings;