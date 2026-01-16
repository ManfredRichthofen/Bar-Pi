import axios from 'axios';
import authHeader from './auth-header';
import config from './config';
import { pinDtoMapper } from './gpio.service';

axios.defaults.baseURL = config.API_BASE_URL;

const API_PATH = 'api/pump/';

class PumpService {
  getAllPumps(token) {
    return axios
      .get(API_PATH, { headers: authHeader(token) })
      .then((response) => response.data);
  }

  createPump(createPump, token) {
    return axios.post(API_PATH, createPump, { headers: authHeader(token) });
  }

  pumpUp(id, token) {
    return axios.put(API_PATH + String(id) + '/pumpup', null, {
      headers: authHeader(token),
    });
  }

  pumpDown(id, token) {
    return axios.put(API_PATH + String(id) + '/pumpback', null, {
      headers: authHeader(token),
    });
  }

  dispatchPumpAdvice(id, advice, token) {
    return axios
      .put(API_PATH + String(id) + '/runjob', advice, {
        headers: authHeader(token),
      })
      .then((response) => response.data);
  }

  getMetrics(jobId, token) {
    return axios
      .get(API_PATH + 'jobmetrics/' + String(jobId), {
        headers: authHeader(token),
      })
      .then((response) => response.data);
  }

  startPump(id, token) {
    const config = {
      params: { id },
      headers: authHeader(token),
    };
    return axios.put(API_PATH + 'start', null, config);
  }

  stopPump(id, token) {
    const config = {
      params: { id },
      headers: authHeader(token),
    };
    return axios.put(API_PATH + 'stop', null, config);
  }

  patchPump(id, patchPump, token) {
    return axios
      .patch(API_PATH + String(id), patchPump, {
        headers: authHeader(token),
      })
      .then((response) => response.data);
  }

  deletePump(id, token) {
    return axios.delete(API_PATH + String(id), {
      headers: authHeader(token),
    });
  }

  getPump(id, token) {
    return axios
      .get(API_PATH + String(id), {
        headers: authHeader(token),
      })
      .then((response) => response.data);
  }
}

export class PumpDtoMapper {
  toPumpCreateDto(detailed) {
    return {
      type: detailed.type,
      name: detailed.name,
      enablePin: detailed.enablePin,
      stepPin: detailed.stepPin,
      acceleration: detailed.acceleration,
      maxStepsPerSecond: detailed.maxStepsPerSecond,
      stepsPerCl: detailed.stepsPerCl,
      tubeCapacityInMl: detailed.tubeCapacityInMl,
      fillingLevelInMl: detailed.fillingLevelInMl,
      isPumpedUp: detailed.pumpedUp,
      currentIngredientId: detailed.currentIngredient?.id,

      timePerClInMs: detailed.timePerClInMs,
      isPowerStateHigh: detailed.isPowerStateHigh,

      pin: detailed.pin,
    };
  }

  toPumpPatchDto(detailed) {
    let dcPumpPin = null;
    if (detailed.pin) {
      dcPumpPin = pinDtoMapper.toPinSelectDto(detailed.pin);
    }
    let stepperEnablePin = null;
    if (detailed.enablePin) {
      stepperEnablePin = pinDtoMapper.toPinSelectDto(detailed.enablePin);
    }
    let stepperStepPin = null;
    if (detailed.stepPin) {
      stepperStepPin = pinDtoMapper.toPinSelectDto(detailed.stepPin);
    }
    const dto = {
      pin: dcPumpPin,
      timePerClInMs: detailed.timePerClInMs,
      isPowerStateHigh: detailed.isPowerStateHigh,
      name: detailed.name,
      tubeCapacityInMl: detailed.tubeCapacityInMl,
      fillingLevelInMl: detailed.fillingLevelInMl,
      isPumpedUp: detailed.pumpedUp,
      currentIngredientId: detailed.currentIngredient?.id,

      enablePin: stepperEnablePin,
      stepPin: stepperStepPin,
      acceleration: detailed.acceleration,
      maxStepsPerSecond: detailed.maxStepsPerSecond,
      stepsPerCl: detailed.stepsPerCl,

      type: detailed.type,
      removeFields:
        !detailed.removeFields || detailed.removeFields.length === 0
          ? undefined
          : detailed.removeFields,
    };
    return dto;
  }
}

export default new PumpService();

export const pumpDtoMapper = new PumpDtoMapper();
