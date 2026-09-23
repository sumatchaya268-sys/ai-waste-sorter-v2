'use client';
import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera as CameraIcon, ZoomIn } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
}

export default function Camera({ onCapture }: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [hasHardwareZoom, setHasHardwareZoom] = useState<boolean>(false);
  const [maxHardwareZoom, setMaxHardwareZoom] = useState<number>(3);

  const handleUserMedia = useCallback((stream: MediaStream) => {
    try {
      const track = stream.getVideoTracks()[0];
      // Type assertion because standard TS dom lib might not have getCapabilities yet
      const capabilities = (track as any).getCapabilities ? (track as any).getCapabilities() : {};
      
      if (capabilities.zoom) {
        setHasHardwareZoom(true);
        setMaxHardwareZoom(capabilities.zoom.max || 3);
        // Apply initial zoom
        (track as any).applyConstraints({
          advanced: [{ zoom: 1 }]
        });
      } else {
        setHasHardwareZoom(false);
      }
    } catch (e) {
      console.error("Error checking camera capabilities:", e);
      setHasHardwareZoom(false);
    }
  }, []);

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (hasHardwareZoom && webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      try {
        // Clamp to max supported hardware zoom
        const actualZoom = Math.min(newZoom, maxHardwareZoom);
        (track as any).applyConstraints({
          advanced: [{ zoom: actualZoom }]
        });
      } catch (e) {
        console.error("Error applying zoom constraint:", e);
      }
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      if (!hasHardwareZoom && zoom > 1) {
        // Digital zoom fallback: crop the center of the image
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Calculate cropped dimensions
            const sWidth = img.width / zoom;
            const sHeight = img.height / zoom;
            const sx = (img.width - sWidth) / 2;
            const sy = (img.height - sHeight) / 2;
            
            canvas.width = img.width;
            canvas.height = img.height;
            // Draw cropped area stretched to original resolution (simulating zoom)
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
            onCapture(canvas.toDataURL('image/jpeg', 0.9));
          } else {
            onCapture(imageSrc); // Fallback to uncropped if canvas fails
          }
        };
        img.src = imageSrc;
      } else {
        onCapture(imageSrc);
      }
    }
  }, [onCapture, hasHardwareZoom, zoom]);

  const zoomLevels = [1, 1.5, 2, 3];

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 w-full max-w-md bg-black">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'environment' }}
          onUserMedia={handleUserMedia}
          className="w-full h-auto"
          style={{ 
            transform: !hasHardwareZoom && zoom > 1 ? `scale(${zoom})` : 'scale(1)', 
            transformOrigin: 'center center', 
            transition: 'transform 0.3s ease-out' 
          }}
        />
      </div>
      
      {/* Zoom Controls */}
      <div className="flex flex-col items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="flex items-center text-gray-500 mb-2 text-sm font-medium">
          <ZoomIn className="w-4 h-4 mr-1" />
          <span>เลือกระดับการซูม {!hasHardwareZoom && '(Digital Zoom)'}</span>
        </div>
        <div className="flex justify-center space-x-2">
          {zoomLevels.map((z) => (
            <button
              key={z}
              onClick={() => handleZoomChange(z)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                zoom === z 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {z}×
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center px-4">
          💡 ปรับ Zoom เพื่อจัดขยะให้อยู่กลางกรอบและเห็นได้ชัดเจน
        </p>
      </div>

      <button
        onClick={capture}
        className="flex items-center px-8 py-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition shadow-lg text-lg font-bold"
      >
        <CameraIcon className="mr-2 w-6 h-6" />
        ถ่ายภาพ
      </button>
    </div>
  );
}
