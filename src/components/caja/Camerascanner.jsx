/* eslint-disable no-unused-vars */
import { Box, Typography } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

const CameraScanner = ({ onDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [lastDetected, setLastDetected] = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stopped = false;
    let stream = null;

    const startScanner = async () => {
      await new Promise((res) => setTimeout(res, 500));
      if (stopped) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        });

        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
          BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const codeReader = new BrowserMultiFormatReader(hints);
        readerRef.current = codeReader;
        setScanning(true);

        let frames = 0;
        const scanFrame = async () => {
          if (stopped) return;
          if (!videoRef.current || !canvasRef.current) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          frames++;
          if (frames % 30 === 0) setFrameCount(frames);

          try {
            const result = await codeReader.decodeFromCanvas(canvas);
            if (result && !stopped) {
              const codigo = result.getText();
              if (codigo.length < 6) return;
              setLastDetected(codigo);
              onDetectedRef.current(codigo);
            }
           
          } catch (_) { /* NotFoundException normal */ }

          await new Promise(r => setTimeout(r, 100));
          if (!stopped) animFrameRef.current = requestAnimationFrame(scanFrame);
        };

        scanFrame();
      } catch (e) {
        if (stopped) return;
        if (e.name === "NotAllowedError") setError("Permiso de cámara denegado.");
        else if (e.name === "NotFoundError") setError("No se encontró ninguna cámara.");
        else setError(`Error: ${e.message}`);
      }
    };

    startScanner();

    return () => {
      stopped = true;
      setScanning(false);
      cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      // eslint-disable-next-line no-empty
      try { readerRef.current?.reset(); } catch (_) {}
    };
  }, []);

  if (error) {
    return (
      <Box sx={{
        p: 4, textAlign: "center", backgroundColor: "#fef2f2",
        borderRadius: 2, border: "2px dashed #fca5a5", m: 2
      }}>
        <Typography variant="body2" sx={{ color: "var(--error)", fontWeight: 600, mb: 1 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", backgroundColor: "#000", borderRadius: 2, overflow: "hidden" }}>
      <video ref={videoRef} style={{ width: "100%", maxHeight: 350, display: "block" }} muted playsInline />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Visor */}
      <Box sx={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", pointerEvents: "none"
      }}>
        <Box sx={{
          width: 260, height: 130,
          border: "3px solid #4ade80", borderRadius: 2,
          boxShadow: "0 0 0 2000px rgba(0,0,0,0.45), 0 0 20px #4ade80",
          position: "relative", overflow: "hidden"
        }}>
          {scanning && (
            <Box sx={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent, #4ade80, transparent)",
              animation: "scan 1.5s ease-in-out infinite alternate",
              "@keyframes scan": { from: { top: "0%" }, to: { top: "100%" } },
            }} />
          )}
        </Box>
      </Box>

      {/* Estado */}
      <Box sx={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center" }}>
        <Typography variant="caption" sx={{
          color: "white", backgroundColor: "rgba(0,0,0,0.7)",
          px: 2, py: 0.8, borderRadius: 20, fontWeight: 600
        }}>
          {scanning ? `📱 Escaneando... (frame ${frameCount})` : "⏳ Iniciando..."}
        </Typography>
      </Box>

      {/* Último detectado */}
      {lastDetected && (
        <Box sx={{
          position: "absolute", top: 12, left: 12, right: 12,
          backgroundColor: "rgba(0,0,0,0.85)", border: "2px solid #4ade80",
          borderRadius: 2, p: 1.5, textAlign: "center"
        }}>
          <Typography variant="caption" sx={{ color: "#4ade80", display: "block", fontWeight: 800, fontSize: "0.7rem" }}>
            ✅ CÓDIGO DETECTADO
          </Typography>
          <Typography variant="body2" sx={{ color: "white", fontWeight: 900, fontFamily: "monospace" }}>
            {lastDetected}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CameraScanner;