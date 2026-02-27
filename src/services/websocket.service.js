import { Client } from '@stomp/stompjs';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useConfigStore from '../store/configStore';
import authHeader from './auth-header';

// Get initial API URL from store
const configStore = useConfigStore.getState();
axios.defaults.baseURL = configStore.apiBaseUrl;

const getFormattedServerAddress = () => {
  return useConfigStore.getState().apiBaseUrl;
};

const isDevelopment = () => {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
};

class WebsocketService {
  subscriptions = new Map();
  activeSubscriptions = new Map();
  callbackData = new Map();
  connected = false;
  showReconnectDialog = false;
  secondsTillWebsocketReconnect = 5;
  reconnectThrottleInSeconds = 5;

  reconnectTasks = [];
  stompClient = null;
  csrf = null;

  constructor() {
    addEventListener('beforeunload', () => {
      this.disconnectWebsocket();
    });
  }

  async connectWebsocket(token) {
    // Remove trailing slash from API_BASE_URL to prevent double slashes
    const baseUrl = useConfigStore.getState().apiBaseUrl.replace(/\/$/, '');
    
    // Convert http/https to ws/wss for WebSocket URL
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/websocket';

    this.stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {}, // Disable debug logging
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = async () => {
      this.reconnectThrottleInSeconds = 5;
      this.showReconnectDialog = false;

      for (const [path, callback] of this.subscriptions.entries()) {
        const activeSub = this.stompClient.subscribe(path, callback);
        this.activeSubscriptions.set(path, activeSub);
      }
      this.connected = true;
    };

    for (const id of this.reconnectTasks) {
      clearTimeout(id);
    }
    this.reconnectTasks = [];

    this.stompClient.onWebSocketClose = () => {
      this.stompClient = null;
      this.connected = false;
      this.activeSubscriptions.clear();
      this.showReconnectDialog = true;

      const reconnectThrottle = this.reconnectThrottleInSeconds || 5;
      this.reconnectThrottleInSeconds = Math.min(20, reconnectThrottle * 2);

      for (let i = reconnectThrottle; i > 0; i--) {
        this.reconnectTasks.push(
          setTimeout(
            () => {
              this.secondsTillWebsocketReconnect = i;
            },
            (reconnectThrottle - i) * 1000,
          ),
        );
      }
      this.reconnectTasks.push(
        setTimeout(() => {
          this.connectWebsocket(token);
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
      const onMessage = (message) => {
        const callbackDataPath = this.callbackData.get(path);
        callbackDataPath.lastMsg = message;
        for (const cb of callbackDataPath.subscribers.values()) {
          cb(message);
        }
      };
      this.subscriptions.set(path, onMessage);
      if (this.connected && this.stompClient) {
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

  getShowReconnectDialog() {
    return this.showReconnectDialog;
  }

  getSecondsTillWebsocketReconnect() {
    return this.secondsTillWebsocketReconnect;
  }
}

export default new WebsocketService();
