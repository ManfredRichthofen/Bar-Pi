import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import authHeader from './auth-header';
import useAuthStore from '../store/authStore';
import config from './config';

const getFormattedServerAddress = () => {
  return config.API_BASE_URL;
};

class WebsocketService {
  subscriptions = new Map();
  activeSubscriptions = new Map();
  callbackData = new Map();

  reconnectTasks = [];
  stompClient = null;
  csrf = null;

  constructor() {
    addEventListener('beforeunload', (event) => {
      this.disconnectWebsocket();
    });
  }

  async connectWebsocket(token) {
    this.stompClient = Stomp.over(
      () => new SockJS(getFormattedServerAddress() + '/websocket'),
    );

    this.stompClient.connectHeaders = {
      Authorization: authHeader(token),
    };
    const vm = this;
    this.stompClient.onConnect = async function () {
      vm.reconnectThrottleInSeconds = 5;
      vm.showReconnectDialog = false;

      for (const [path, callback] of vm.subscriptions.entries()) {
        const activeSub = vm.stompClient.subscribe(path, callback);
        vm.activeSubscriptions.set(path, activeSub);
      }
      vm.connected = true;
    };

    if (!process.env.DEV) {
      this.stompClient.debug = function (str) {};
    }

    for (const id of this.reconnectTasks) {
      clearTimeout(id);
    }
    this.reconnectTasks = [];

    this.stompClient.onWebSocketClose = function () {
      vm.stompClient = null;
      vm.connected = false;
      vm.activeSubscriptions.clear();
      vm.showReconnectDialog = true;

      const reconnectThrottle = vm.reconnectThrottleInSeconds || 5;
      vm.reconnectThrottleInSeconds = Math.min(20, reconnectThrottle * 2);

      for (let i = reconnectThrottle; i > 0; i--) {
        vm.reconnectTasks.push(
          setTimeout(
            () => {
              vm.secondsTillWebsocketReconnect = i;
            },
            (reconnectThrottle - i) * 1000,
          ),
        );
      }
      vm.reconnectTasks.push(
        setTimeout(() => {
          vm.connectWebsocket(token);
        }, reconnectThrottle * 1000),
      );
    };

    try {
      this.stompClient.activate();
    } catch (e) {
      this.stompClient.onWebSocketClose();
    }
  }

  disconnectWebsocket() {
    if (this.stompClient != null) {
      this.connected = false;
      this.stompClient.onWebSocketClose = () => {};
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.activeSubscriptions.clear();
  }

  subscribe(component, path, callback, getLastMsg = false) {
    if (!this.callbackData.has(path)) {
      this.callbackData.set(path, {
        subscribers: new Map(),
        lastMsg: null,
      });
    }
    const callbackDataPath = this.callbackData.get(path);
    callbackDataPath.subscribers.set(component, callback);

    if (getLastMsg && !!callbackDataPath.lastMsg) {
      callback(callbackDataPath.lastMsg);
    }

    if (!this.subscriptions.has(path)) {
      const onMessage = (data) => {
        const callbackDataPath = this.callbackData.get(path);
        callbackDataPath.lastMsg = data;
        for (const cb of callbackDataPath.subscribers.values()) {
          cb(data);
        }
      };
      this.subscriptions.set(path, onMessage);
      if (this.connected) {
        const activeSub = this.stompClient.subscribe(path, onMessage);
        this.activeSubscriptions.set(path, activeSub);
      }
    }
  }

  unsubscribe(component, path) {
    const callbackDataPath = this.callbackData.get(path);
    if (callbackDataPath) {
      callbackDataPath.subscribers.delete(component);

      if (callbackDataPath.subscribers.size !== 0) {
        return;
      }
    }
    this.callbackData.delete(path);

    this.subscriptions.delete(path);
    if (!this.activeSubscriptions.has(path)) {
      return;
    }
    this.activeSubscriptions.get(path).unsubscribe();
    this.activeSubscriptions.delete(path);
  }
}

export default new WebsocketService();
