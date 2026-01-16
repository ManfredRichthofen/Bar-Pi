import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import useAuthStore from '../store/authStore';

const API_PATH = 'api/recipe/';

// Cache for loaded images
const imageCache = new Map();

export const useLazyImage = (recipeId, hasImage) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const token = useAuthStore((state) => state.token);
  const observerRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!hasImage || !recipeId) return;

    // Check cache first
    if (imageCache.has(recipeId)) {
      setImageUrl(imageCache.get(recipeId));
      return;
    }

    // Set up Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !imageUrl && !loading) {
            loadImage();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [recipeId, hasImage, token]);

  const loadImage = async () => {
    if (!token || loading || imageUrl) return;

    setLoading(true);
    setError(false);

    try {
      const response = await axios.get(`${API_PATH}${recipeId}/image`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'image/jpeg, image/png, image/*',
        },
        responseType: 'arraybuffer',
      });

      const uint8Array = new Uint8Array(response.data);
      const base64String = btoa(
        uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), ''),
      );
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${base64String}`;

      // Cache the image
      imageCache.set(recipeId, dataUrl);
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('Failed to load image:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return { imageUrl, loading, error, elementRef };
};
