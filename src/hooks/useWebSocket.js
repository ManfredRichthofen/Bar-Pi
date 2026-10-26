import { useEffect } from 'react';
import WebsocketService from '../services/websocket.service';
import useCocktailProgressStore from '../store/cocktailProgressStore';

/**
 * Single entry for WebSocket connection + optional cocktail-progress subscription.
 * Pass `subscribeProgress: false` when only ensuring the connection (e.g. PumpsPage).
 */
export const useWebSocket = (
  token,
  { keepAlive = false, subscribeProgress = true } = {},
) => {
  const setProgress = useCocktailProgressStore((state) => state.setProgress);
  const clearProgress = useCocktailProgressStore(
    (state) => state.clearProgress,
  );

  useEffect(() => {
    if (!token) return;

    if (!WebsocketService.connected) {
      WebsocketService.connectWebsocket(token);
    }

    if (!subscribeProgress) {
      return;
    }

    WebsocketService.subscribe(
      'cocktailProgress',
      '/user/topic/cocktailprogress',
      (message) => {
        if (message.body === 'DELETE') {
          clearProgress();
        } else {
          const progress = JSON.parse(message.body);
          progress.recipe.lastUpdate = new Date(progress.recipe.lastUpdate);
          setProgress(progress);
        }
      },
      true,
    );

    return () => {
      WebsocketService.unsubscribe(
        'cocktailProgress',
        '/user/topic/cocktailprogress',
      );
      if (!keepAlive) {
        WebsocketService.disconnectWebsocket();
      }
    };
  }, [token, setProgress, clearProgress, keepAlive, subscribeProgress]);
};
