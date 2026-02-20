// hooks/useImageToBase64.js
import { useState, useEffect } from 'react';

export const useImageToBase64 = (imagePath = '/logo.png') => {
  const [base64, setBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const convertToBase64 = async () => {
      try {
        setLoading(true);
        
        // Intentar múltiples métodos de carga
        const base64Result = await loadImageWithRetry(imagePath);
        
        if (base64Result) {
          setBase64(base64Result);
        } else {
          throw new Error('No se pudo cargar la imagen');
        }
        
      } catch (err) {
        setError(err.message);
        console.error('Error en useImageToBase64:', err);
      } finally {
        setLoading(false);
      }
    };

    convertToBase64();
  }, [imagePath]);

  return { base64, loading, error };
};

// Función auxiliar con reintentos
const loadImageWithRetry = async (imagePath, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imagePath + (attempt > 0 ? `?t=${Date.now()}` : '');
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Probar diferentes formatos
      const formats = ['image/png', 'image/jpeg', 'image/webp'];
      
      for (const format of formats) {
        const base64String = canvas.toDataURL(format);
        if (base64String && base64String !== 'data:,') {
          return base64String;
        }
      }
      
    } catch (e) {
      console.log(`Intento ${attempt + 1} falló:`, e);
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return null;
};