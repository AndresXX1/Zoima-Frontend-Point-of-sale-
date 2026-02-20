// components/ImageToBase64.jsx
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const ImageToBase64 = ({ 
  imagePath = '/logo.png', 
  onBase64Ready,
  width = 30,
  height = 30,
  showPreview = false 
}) => {
  const [base64, setBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const convertImageToBase64 = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Crear una nueva imagen
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Importante para evitar CORS
        
        // Esperar a que la imagen cargue
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imagePath;
        });

        // Crear canvas para convertir a Base64
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Convertir a Base64 (intentar con PNG primero)
        let base64String = canvas.toDataURL('image/png');
        
        // Si el PNG está vacío, intentar con JPEG
        if (base64String === 'data:,') {
          base64String = canvas.toDataURL('image/jpeg', 1.0);
        }
        
        setBase64(base64String);
        
        // Llamar al callback con el Base64
        if (onBase64Ready) {
          onBase64Ready(base64String);
        }
        
      } catch (err) {
        console.error('Error convirtiendo imagen a Base64:', err);
        setError(err.message);
        
        // Intentar con rutas alternativas
        tryAlternativePaths(imagePath, onBase64Ready);
      } finally {
        setLoading(false);
      }
    };

    convertImageToBase64();
  }, [imagePath, onBase64Ready]);

  // Función para intentar rutas alternativas
  const tryAlternativePaths = async (originalPath, callback) => {
    const alternativePaths = [
      '/assets/logo.png',
      '/img/logo.png',
      '/images/logo.png',
      '/public/logo.png',
      window.location.origin + '/logo.png'
    ];

    for (const altPath of alternativePaths) {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = altPath;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const base64String = canvas.toDataURL('image/png');
        
        if (base64String !== 'data:,') {
          setBase64(base64String);
          if (callback) callback(base64String);
          break;
        }
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        console.log(`No se pudo cargar desde: ${altPath}`);
      }
    }
  };

  if (showPreview) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {loading && <CircularProgress size={24} />}
        {error && (
          <Typography variant="caption" color="error">
            Error: {error}
          </Typography>
        )}
        {base64 && !loading && (
          <img 
            src={base64} 
            alt="Logo Preview" 
            style={{ 
              width, 
              height, 
              objectFit: 'contain' 
            }} 
          />
        )}
      </Box>
    );
  }

  return null; // Si no se muestra preview, no renderiza nada
};

export default ImageToBase64;