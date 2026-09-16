'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Camera from '@/components/Camera';
import UploadBox from '@/components/UploadBox';
import StatCard from '@/components/StatCard';
import { Trash2, Recycle, AlertTriangle, Package, CheckCircle } from 'lucide-react';

type Mode = 'general' | 'school';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('general');
  const [inputMethod, setInputMethod] = useState<'camera' | 'upload'>('camera');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({ total: 0, recycle: 0, general: 0, hazardous: 0, organic: 0 });
  const [schoolStats, setSchoolStats] = useState({ totalScanned: 0, totalDisposed: 0, recycle: 0, general: 0, organic: 0, hazardous: 0 });

  useEffect(() => {
    // Load stats from localStorage
    const history = JSON.parse(localStorage.getItem('wasteHistory') || '[]');
    let validWasteCount = 0;
    const newStats = { total: 0, recycle: 0, general: 0, hazardous: 0, organic: 0 };
    const newSchoolStats = { totalScanned: 0, totalDisposed: 0, recycle: 0, general: 0, organic: 0, hazardous: 0 };
    
    history.forEach((item: any) => {
      // ข้ามการนับสถิติถ้า AI บอกว่าไม่ใช่ขยะ
      if (item.category === 'ไม่ใช่ขยะ' || item.category.includes('ไม่ใช่ขยะ')) return;
      
      if (item.mode === 'general' || !item.mode) {
        if (item.isDisposed) {
          validWasteCount++;
          if (item.category.includes('รีไซเคิล') || item.category.includes('ขวดน้ำ')) newStats.recycle++;
          else if (item.category.includes('อันตราย') || item.isHardToDispose) newStats.hazardous++;
          else if (item.category.includes('เปียก') || item.category.includes('อาหาร') || item.category.includes('ใบไม้')) newStats.organic++;
          else newStats.general++;
        }
      } else if (item.mode === 'school') {
        newSchoolStats.totalScanned++;
        if (item.isDisposed) {
          newSchoolStats.totalDisposed++;
          if (item.category.includes('รีไซเคิล') || item.category.includes('ขวดน้ำ')) newSchoolStats.recycle++;
          else if (item.category.includes('อันตราย') || item.isHardToDispose) newSchoolStats.hazardous++;
          else if (item.category.includes('เปียก') || item.category.includes('อาหาร') || item.category.includes('ใบไม้')) newSchoolStats.organic++;
          else newSchoolStats.general++;
        }
      }
    });
    
    newStats.total = validWasteCount;
    setStats(newStats);
    setSchoolStats(newSchoolStats);
  }, []);

  const handleImageSubmit = async (imageSrc: string) => {
    setIsAnalyzing(true);
    try {
      // Store current image temporarily to pass to result page
      sessionStorage.setItem('currentImage', imageSrc);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc, mode }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        let currentRecord = { ...data, mode };
        if (data.category !== 'ไม่ใช่ขยะ' && !data.category.includes('ไม่ใช่ขยะ')) {
          const history = JSON.parse(localStorage.getItem('wasteHistory') || '[]');
          const id = Date.now().toString();
          const newRecord = { ...data, id, date: new Date().toISOString(), isDisposed: false, mode };
          localStorage.setItem('wasteHistory', JSON.stringify([newRecord, ...history]));
          currentRecord = newRecord;
        }
        
        // Pass result via sessionStorage for the result page
        sessionStorage.setItem('currentResult', JSON.stringify(currentRecord));
        router.push('/result');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์');
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-green-700 mb-2">AI Waste Sorter</h1>
        <p className="text-gray-600">ระบบช่วยแยกขยะอัจฉริยะด้วย AI</p>
      </header>

      {/* Stats Dashboard */}
      <section className="mb-12">
        {mode === 'general' ? (
          <>
            <h2 className="text-2xl font-semibold mb-4">สถิติการแยกขยะของคุณ (ส่วนตัว)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="จัดการแล้ว" value={stats.total} icon={Package} color="text-blue-600" />
              <StatCard title="รีไซเคิล" value={stats.recycle} icon={Recycle} color="text-green-600" />
              <StatCard title="ทั่วไป" value={stats.general} icon={Trash2} color="text-gray-600" />
              <StatCard title="อันตราย" value={stats.hazardous} icon={AlertTriangle} color="text-red-600" />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">📊 สถิติภาพรวมโรงเรียน</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <StatCard title="สแกนทั้งหมด" value={schoolStats.totalScanned} icon={Package} color="text-indigo-600" />
              <StatCard title="ยืนยันการจัดการแล้ว" value={schoolStats.totalDisposed} icon={CheckCircle} color="text-green-600" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="รีไซเคิล" value={schoolStats.recycle} icon={Recycle} color="text-blue-500" />
              <StatCard title="ทั่วไป" value={schoolStats.general} icon={Trash2} color="text-gray-500" />
              <StatCard title="เศษอาหาร" value={schoolStats.organic} icon={Package} color="text-yellow-600" />
              <StatCard title="อันตราย" value={schoolStats.hazardous} icon={AlertTriangle} color="text-red-500" />
            </div>
          </>
        )}
      </section>

      {/* Mode Selection */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">เลือกโหมดการใช้งาน</h2>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setMode('general')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              mode === 'general' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            โหมดทั่วไป
          </button>
          <button
            onClick={() => setMode('school')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              mode === 'school' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            โหมดโรงเรียน
          </button>
        </div>
      </section>

      {/* Input Method */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setInputMethod('camera')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              inputMethod === 'camera' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ถ่ายภาพ
          </button>
          <button
            onClick={() => setInputMethod('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              inputMethod === 'upload' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            อัปโหลด
          </button>
        </div>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">กำลังวิเคราะห์ภาพขยะด้วย AI...</p>
          </div>
        ) : (
          <div>
            {inputMethod === 'camera' ? (
              <Camera onCapture={handleImageSubmit} />
            ) : (
              <UploadBox onUpload={handleImageSubmit} />
            )}
          </div>
        )}
      </section>
    </main>
  );
}
