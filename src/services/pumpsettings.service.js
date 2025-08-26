import axios from "axios";
import { pinDtoMapper } from "./gpio.service";
import authHeader from "./auth-header";
import config from "./config";
axios.defaults.baseURL = config.API_BASE_URL;

const API_PATH = "api/pump/settings/";

class PumpSettingsService {
	setReversePumpSettings(settings, token) {
		const dto = {
			enable: settings.enable,
			settings: settings.enable
				? {
						directorPin: pinDtoMapper.toPinSelectDto(
							settings.settings.directorPin,
						),
						overshoot: settings.settings.overshoot,
						autoPumpBackTimer: settings.settings.autoPumpBackTimer,
					}
				: undefined,
		};
		return axios.put(API_PATH + "reversepumping", dto, {
			headers: authHeader(token),
		});
	}

	getReversePumpSettings(token) {
		return axios
			.get(API_PATH + "reversepumping", { headers: authHeader(token) })
			.then((response) => {
				if (!response.data.settings) {
					delete response.data.settings;
				}
				return response.data;
			});
	}

	setLoadCell(loadcell, token) {
		let dto = null;
		if (loadcell != null) {
			dto = {
				clkPin: pinDtoMapper.toPinSelectDto(loadcell.clkPin),
				dtPin: pinDtoMapper.toPinSelectDto(loadcell.dtPin),
			};
		}
		return axios
			.put(API_PATH + "loadcell", dto, {
				headers: {
					...authHeader(token),
					"Content-Type": "application/json",
				},
			})
			.then((response) => response.data);
	}

	getLoadCell(token) {
		return axios
			.get(API_PATH + "loadcell", {
				headers: authHeader(token),
			})
			.then((response) => response.data);
	}

	readLoadCell(token) {
		return axios
			.get(API_PATH + "loadcell/read", {
				headers: authHeader(token),
			})
			.then((response) => response.data);
	}

	calibrateLoadCellZero(token) {
		return axios
			.put(API_PATH + "loadcell/calibratezero", null, {
				headers: authHeader(token),
			})
			.then((response) => response.data);
	}

	calibrateLoadCellRefWeight(referenceWeight, token) {
		return axios
			.put(API_PATH + "loadcell/calibratereference", referenceWeight, {
				headers: {
					...authHeader(token),
					"Content-Type": "application/json",
				},
			})
			.then((response) => response.data);
	}
}

export default new PumpSettingsService();
