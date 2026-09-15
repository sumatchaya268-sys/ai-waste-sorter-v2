'use client';
import React, { useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera as CameraIcon } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
}

export default function Camera({ onCapture }: CameraProps) {
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'environment' }}
          className="w-full max-w-md h-auto"
        />
      </div>
      <button
        onClick={capture}
        className="flex items-center px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition shadow-md"
      >
        <CameraIcon className="mr-2" />
        ถ่ายภาพ
      </button>
    </div>
  );
}
