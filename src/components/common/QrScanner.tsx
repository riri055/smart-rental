import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, Loader2, TriangleAlert, ScanLine } from 'lucide-react';

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'error';

interface QrScannerProps {
  active: boolean;
  onDetect: (value: string) => void;
  onError?: (message: string) => void;
}

/**
 * Camera-based QR decoder built on jsQR (pure JS) + getUserMedia.
 *
 * The parent controls scanning via `active`. When active flips true the camera
 * is requested and a rAF loop decodes frames from a hidden canvas. When a QR
 * code is decoded the stream is stopped and `onDetect` fires once.
 */
export const QrScanner: React.FC<QrScannerProps> = ({ active, onDetect, onError }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Keep the latest callbacks without restarting the effect loop.
  const onDetectRef = useRef(onDetect);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stop();
      setStatus('idle');
      setError(null);
      return;
    }

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, width, height, {
              inversionAttempts: 'dontInvert',
            });
            if (code && code.data) {
              stop();
              onDetectRef.current(code.data);
              return;
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const start = async () => {
      setStatus('starting');
      setError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not supported in this browser.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('scanning');
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setStatus('error');
        setError(message);
        onErrorRef.current?.(message);
      }
    };

    void start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, stop]);

  if (!active) return null;

  return (
    <div className="rounded-lg border border-[#242424]/20 bg-[#242424] overflow-hidden">
      <div className="relative aspect-[4/3] w-full">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#242424]/85 text-[#FFFDF7]">
            <Loader2 className="w-6 h-6 animate-spin text-[#F7C83E]" />
            <span className="text-xs font-mono">Requesting camera…</span>
          </div>
        )}

        {status === 'scanning' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-40 w-40 sm:h-52 sm:w-52">
              <div className="absolute inset-0 rounded-lg border-2 border-[#F7C83E]/80" />
              <span className="absolute top-1 left-1 h-4 w-4 border-t-2 border-l-2 border-[#FFFDF7]" />
              <span className="absolute top-1 right-1 h-4 w-4 border-t-2 border-r-2 border-[#FFFDF7]" />
              <span className="absolute bottom-1 left-1 h-4 w-4 border-b-2 border-l-2 border-[#FFFDF7]" />
              <span className="absolute bottom-1 right-1 h-4 w-4 border-b-2 border-r-2 border-[#FFFDF7]" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#242424]/90 text-center px-6">
            <TriangleAlert className="w-6 h-6 text-[#F7C83E]" />
            <span className="text-xs text-[#FFFDF7] font-semibold">
              Camera unavailable
            </span>
            <span className="text-[11px] text-[#D5D2C9]">{error}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-[#D5D2C9]">
        <span className="flex items-center gap-1.5 font-mono">
          {status === 'scanning' ? (
            <>
              <ScanLine className="w-3.5 h-3.5 text-[#F7C83E]" />
              Align QR code inside the frame
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 text-[#F7C83E]" />
              Camera preview
            </>
          )}
        </span>
      </div>
    </div>
  );
};
