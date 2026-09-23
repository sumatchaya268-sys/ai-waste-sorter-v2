'use client';
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface UploadBoxProps {
  onUpload: (imageSrc: string) => void;
}

export default function UploadBox({ onUpload }: UploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use createObjectURL instead of readAsDataURL to save massive amounts of RAM on mobile
      const objectUrl = URL.createObjectURL(file);
      onUpload(objectUrl);
    }
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition w-full max-w-md mx-auto"
    >
      <Upload className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-gray-600 font-medium">คลิกเพื่ออัปโหลดภาพขยะ</p>
      <p className="text-sm text-gray-400 mt-2">รองรับ JPG, PNG</p>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
