'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AlertBadge from '@/components/AlertBadge';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const savedResult = sessionStorage.getItem('currentResult');
    const savedImage = sessionStorage.getItem('currentImage');
    
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    } else {
      // If no result, redirect home
      router.push('/');
    }
    
    if (savedImage) {
      setImage(savedImage);
    }
  }, [router]);

  if (!result) return <div className="min-h-screen flex items-center justify-center p-8">กำลังโหลดข้อมูล...</div>;

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto font-sans bg-gray-50">
      <button 
        onClick={() => router.push('/')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="mr-2 w-5 h-5" />
        กลับหน้าแรก
      </button>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {image && (
          <div className="w-full h-64 bg-gray-200 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={image} 
              alt="Waste" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{result.itemName}</h1>
              <span className="inline-block px-4 py-1.5 bg-green-100 text-green-800 rounded-full font-medium">
                ประเภท: {result.category}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">ความมั่นใจ</div>
              <div className="text-2xl font-bold text-blue-600">{result.confidence}%</div>
            </div>
          </div>

          {result.isHardToDispose && (
            <AlertBadge 
              type="error" 
              message="ขยะชิ้นนี้เป็นขยะอันตรายหรือจัดการยาก โปรดใช้ความระมัดระวังในการทิ้ง!" 
            />
          )}

          {result.warningMessage && !result.isHardToDispose && (
            <AlertBadge 
              type="warning" 
              message={result.warningMessage} 
            />
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="mr-2 text-green-600 w-6 h-6" />
              วิธีจัดการที่ถูกต้อง
            </h2>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 whitespace-pre-wrap text-gray-700 leading-relaxed">
              {result.disposalSteps}
            </div>
          </div>

          {result.category !== 'ไม่ใช่ขยะ' && !result.category.includes('ไม่ใช่ขยะ') && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center">
              <p className="text-gray-500 text-sm mb-4">
                *การยืนยันเป็นข้อมูลที่คุณแจ้งด้วยตนเอง เพื่อบันทึกเป็นสถิติการจัดการขยะ
              </p>
              <button
                onClick={() => {
                  if (result.id) {
                    const history = JSON.parse(localStorage.getItem('wasteHistory') || '[]');
                    const recordIndex = history.findIndex((h: any) => h.id === result.id);
                    if (recordIndex !== -1) {
                      history[recordIndex].isDisposed = true;
                      localStorage.setItem('wasteHistory', JSON.stringify(history));
                    }
                  }
                  alert('บันทึกการจัดการขยะเรียบร้อยแล้ว ขอบคุณที่ช่วยรักษาสิ่งแวดล้อม!');
                  router.push('/');
                }}
                className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-lg"
              >
                ✅ ฉันทิ้ง/จัดการแล้ว
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
