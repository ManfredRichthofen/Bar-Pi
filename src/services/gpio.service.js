import axios, { authHeaders } from '../lib/apiClient';

const API_PATH = 'api/gpio/';

class GpioService {
  types = {
    LOCAL: 'local',
    I2C: 'i2c',
  };

  getBoardsByType(dType, token) {
    return axios
      .get(API_PATH, {
        params: { dType },
        headers: authHeaders(token),
      })
      .then((x) => x.data);
  }

  getBoards(token) {
    return axios
      .get(API_PATH, {
        headers: authHeaders(token),
      })
      .then((x) => x.data);
  }

  getBoard(id, token) {
    return axios
      .get(API_PATH + id, {
        headers: authHeaders(token),
      })
      .then((x) => x.data);
  }

  createGpioBoard(gpioBoardDto, token) {
    return axios.post(API_PATH, gpioBoardDto, {
      headers: authHeaders(token),
    });
  }

  updateGpioBoard(id, gpioBoardDto, token) {
    return axios.put(API_PATH + id, gpioBoardDto, {
      headers: authHeaders(token),
    });
  }

  deleteGpioBoard(id, token) {
    return axios.delete(API_PATH + id, {
      headers: authHeaders(token),
    });
  }

  getBoardPins(boardId, token) {
    return axios
      .get(API_PATH + boardId + '/pin', {
        headers: authHeaders(token),
      })
      .then((x) => x.data);
  }

  getGpioStatus(token) {
    return axios
      .get(API_PATH + 'status', {
        headers: authHeaders(token),
      })
      .then((x) => x.data);
  }
}

export class PinDtoMapper {
  toPinSelectDto(reduced) {
    if (!reduced) {
      return null;
    }
    return {
      nr: reduced.nr,
      boardId: reduced.boardId,
    };
  }
}

export class GpioBoardDtoMapper {
  toGpioBoardDto(gpioBoard) {
    return {
      name: gpioBoard.name,
      address: gpioBoard.address,
      boardModel: gpioBoard.boardModel,
      type: gpioBoard.type,
    };
  }
}

export default new GpioService();

export const pinDtoMapper = new PinDtoMapper();

export const gpioBoardDtoMapper = new GpioBoardDtoMapper();
