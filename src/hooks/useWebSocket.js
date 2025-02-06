import { useEffect } from 'react';
import WebsocketService from '../services/websocket.service';
import useCocktailProgressStore from '../store/cocktailProgressStore';

export const useWebSocket = (token) => {
  const setProgress = useCocktailProgressStore((state) => state.setProgress);
  const clearProgress = useCocktailProgressStore(
    (state) => state.clearProgress,
  );

  useEffect(() => {
    if (!token) return;

    WebsocketService.connectWebsocket(token);

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
      WebsocketService.disconnectWebsocket();
    };
  }, [token, setProgress, clearProgress]);
};
