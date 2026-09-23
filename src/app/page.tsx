'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Camera from '@/components/Camera';
import UploadBox from '@/components/UploadBox';
import StatCard from '@/components/StatCard';
import { Trash2, Recycle, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';

type Mode = 'general' | 'school';

const tips = [
  "💡 ก่อนทิ้งขวดพลาสติก ควรเทของเหลวออกก่อน",
  "💡 ล้างภาชนะที่มีเศษอาหารก่อนนำไปรีไซเคิล",
  "💡 ถ่านไฟฉายและแบตเตอรี่ไม่ควรทิ้งรวมกับขยะทั่วไป",
  "💡 แยกเศษอาหารออกจากขยะประเภทอื่นก่อนทิ้ง",
  "💡 กล่องกระดาษที่เปียกหรือเปื้อนอาหารอาจไม่เหมาะสำหรับการรีไซเคิล"
];

let cachedGenAI: any = null;
let aiInitPromise: Promise<any> | null = null;

function initAI() {
  if (!aiInitPromise) {
    aiInitPromise = (async () => {
      try {
        const keyRes = await fetch('/api/config');
        const { key } = await keyRes.json();
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        cachedGenAI = new GoogleGenerativeAI(key);
        return cachedGenAI;
      } catch (e) {
        console.error("Failed to init AI", e);
        throw e;
      }
    })();
  }
  return aiInitPromise;
}

export default function Home() {
  const router = useRouter();
  const [showAdmin, setShowAdmin] = useState(false);
  const [mode, setMode] = useState<Mode>('general');
  const [inputMethod, setInputMethod] = useState<'camera' | 'upload'>('camera');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({ totalScanned: 0, total: 0, recycle: 0, general: 0, hazardous: 0, organic: 0 });
  const [schoolStats, setSchoolStats] = useState({ totalScanned: 0, totalDisposed: 0, recycle: 0, general: 0, organic: 0, hazardous: 0 });
  const [dailyTip, setDailyTip] = useState(tips[0]);

  useEffect(() => {
    // Preload AI models to make scanning faster
    initAI().catch(console.error);

    // Set random tip
    setDailyTip(tips[Math.floor(Math.random() * tips.length)]);

    // Load stats from localStorage
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('wasteHistory') || '[]');
    } catch (e) {
      console.error('Failed to parse wasteHistory from localStorage, resetting it.', e);
      localStorage.setItem('wasteHistory', '[]');
    }
    
    let validWasteCount = 0;
    const newStats = { totalScanned: 0, total: 0, recycle: 0, general: 0, hazardous: 0, organic: 0 };
    const newSchoolStats = { totalScanned: 0, totalDisposed: 0, recycle: 0, general: 0, organic: 0, hazardous: 0 };
    
    history.forEach((item: any) => {
      // ข้ามการนับสถิติถ้า AI บอกว่าไม่ใช่ขยะ
      if (!item.category || item.category === 'ไม่ใช่ขยะ' || item.category.includes('ไม่ใช่ขยะ')) return;
      
      if (item.mode === 'general' || !item.mode) {
        newStats.totalScanned++;
        if (item.isDisposed) {
          validWasteCount++;
          if (item.category.includes('รีไซเคิล') || item.category.includes('ขวดน้ำ')) newStats.recycle++;
          else if (item.category.includes('อันตราย')) newStats.hazardous++;
          else if (item.category.includes('ขยะเปียก') || item.category.includes('อินทรีย์') || item.category.includes('เศษอาหาร') || item.category.includes('ใบไม้')) newStats.organic++;
          else newStats.general++;
        }
      } else if (item.mode === 'school') {
        newSchoolStats.totalScanned++;
        if (item.isDisposed) {
          newSchoolStats.totalDisposed++;
          if (item.category.includes('รีไซเคิล') || item.category.includes('ขวดน้ำ')) newSchoolStats.recycle++;
          else if (item.category.includes('อันตราย')) newSchoolStats.hazardous++;
          else if (item.category.includes('ขยะเปียก') || item.category.includes('อินทรีย์') || item.category.includes('เศษอาหาร') || item.category.includes('ใบไม้')) newSchoolStats.organic++;
          else newSchoolStats.general++;
        }
      }
    });
    
    newStats.total = validWasteCount;
    setStats(newStats);
    setSchoolStats(newSchoolStats);
  }, []);

  const [allowImageUpload, setAllowImageUpload] = useState(true);

  const handleImageSubmit = async (imageSrc: string) => {
    setIsAnalyzing(true);
    try {
      // Compress image to prevent "Payload Too Large" error
      const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > height && width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            } else if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = () => {
            reject(new Error('เบราว์เซอร์ไม่สามารถอ่านไฟล์ภาพนี้ได้ (อาจเป็นไฟล์ HEIC หรือฟอร์แมตที่ไม่รองรับ) โปรดลองถ่ายใหม่หรือใช้รูป JPG/PNG ปกติครับ'));
          };
          img.src = base64Str;
        });
      };
      
      const compressedImage = await compressImage(imageSrc);

      // Store current image temporarily to pass to result page
      sessionStorage.setItem('currentImage', compressedImage);
      
      // Get preloaded AI instance (or wait for it if still loading)
      const genAI = cachedGenAI || await initAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      
      const modeInstructions = mode === 'general' 
        ? 'โหมดทั่วไป: หมวดหมู่คือ ขยะอันตราย, รีไซเคิล, ขยะอินทรีย์, ขยะทั่วไป'
        : 'โหมดโรงเรียน: หมวดหมู่คือ ขวดน้ำ, ขยะทั่วไป, ขยะอินทรีย์, เศษอาหาร';

      const prompt = `
        คุณคือผู้เชี่ยวชาญด้านการแยกขยะวิเคราะห์ภาพขยะนี้ตาม ${modeInstructions}
        
        **กฎสำคัญ (บังคับ):** 
        1. ภาพสิ่งของเครื่องใช้ทุกชนิด (เช่น เสื้อผ้าเก่า ของเล่น หนังสือ เครื่องใช้ไฟฟ้า เฟอร์นิเจอร์ ฯลฯ) ที่ผู้ใช้อาจต้องการโละทิ้ง ให้ถือว่าเป็น "สิ่งของที่ต้องการจัดการ" ห้ามตอบว่าไม่ใช่ขยะเด็ดขาด ให้จัดเข้าหมวด "ขยะทั่วไป" หรือ "รีไซเคิล" (ตามความเหมาะสม)
        2. จะตอบว่า "ไม่ใช่ขยะ" ได้ก็ต่อเมื่อ ภาพนั้นเป็น สิ่งมีชีวิต (คน, สัตว์), ทิวทัศน์เปล่าๆ ไม่มีสิ่งของ, หรือภาพเบลอมืดจนมองไม่รู้เรื่องเท่านั้น
        3. ขยะที่ย่อยสลายได้ตามธรรมชาติทั้งหมด เช่น ใบไม้แห้ง กิ่งไม้แห้ง เศษผักผลไม้ เศษอาหาร ให้จัดเป็นหมวด "ขยะอินทรีย์" (ห้ามตอบว่า ขยะเปียก เด็ดขาด โดยเฉพาะกับใบไม้แห้งหรือกิ่งไม้แห้ง) ให้พิจารณาจากวัสดุจริงไม่ใช่แค่ชื่อเรียก
        4. หากภาพเบลอมาก มืดเกินไป มองไม่รู้เรื่อง ห้ามเดามั่ว ให้จัดประเภท category เป็น "ไม่ใช่ขยะ"
        5. คุณต้องตอบกลับมาเป็น JSON เท่านั้น ห้ามพิมพ์ข้อความอื่นนอกกรอบ JSON เด็ดขาด
        
        โปรดส่งคืนผลลัพธ์เป็น JSON format เท่านั้น โดยใช้โครงสร้างนี้:
        {
          "itemName": "ชื่อสิ่งที่อยู่ในภาพ (string)",
          "category": "ประเภทขยะตามโหมดที่เลือก (หากไม่ใช่ขยะให้ตอบว่า 'ไม่ใช่ขยะ') (string)",
          "confidence": "เปอร์เซ็นต์ความมั่นใจ 0-100 (number)",
          "disposalSteps": "วิธีจัดการที่ถูกต้องเป็นข้อๆ (หากไม่ใช่ขยะให้ตอบว่า 'สิ่งนี้ไม่ใช่ขยะ จึงไม่ต้องนำไปทิ้ง') (string)",
          "isHardToDispose": "เป็นขยะอันตรายหรือจัดการยากหรือไม่ (boolean)",
          "warningMessage": "ข้อความแจ้งเตือนถ้ามี (หากไม่ใช่ขยะให้เตือนผู้ใช้ว่า 'ระบบตรวจพบว่านี่ไม่ใช่ขยะ โปรดถ่ายภาพใหม่อีกครั้ง') (string หรือ null)"
        }
        ไม่ต้องใส่ markdown formatting หรือ \`\`\`json กลับมา ให้ส่งคืนเป็น text ที่เป็น JSON ที่ถูกต้องเลย
      `;

      let data = null;
      let lastError: any = null;
      
      // Retry loop for 503 High Demand errors
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Add a 45-second timeout to prevent infinite hanging
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('เซิร์ฟเวอร์ตอบสนองช้าเกินไป (Timeout) โปรดลองใหม่อีกครั้ง')), 45000)
          );

          const aiPromise = model.generateContent([
            prompt,
            {
              inlineData: {
                data: compressedImage.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: 'image/jpeg',
              },
            },
          ]);

          const result = await Promise.race([aiPromise, timeoutPromise]);

          const text = result.response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('AI did not return valid JSON');
          
          data = JSON.parse(jsonMatch[0]);
          break; // Success, exit retry loop
        } catch (e: any) {
          lastError = e;
          // If it's a 503 high demand error or 429 quota, wait and retry
          if (e.message && (e.message.includes('503') || e.message.includes('high demand') || e.message.includes('429') || e.message.includes('quota'))) {
            if (attempt < 3) {
              console.warn(`Attempt ${attempt} failed with ${e.message.includes('429') ? '429' : '503'}, retrying in 2s...`);
              await new Promise(r => setTimeout(r, 2000));
              continue;
            } else {
              throw new Error('เซิร์ฟเวอร์ AI ของ Google มีผู้ใช้งานหนาแน่นมาก โปรดเว้นระยะสักครู่แล้วลองใหม่ครับ');
            }
          }
          // For other errors, throw immediately
          throw e;
        }
      }

      if (!data) throw lastError;

      const response = { ok: true };
      
      if (response.ok) {
        let currentRecord = { ...data, mode };
        if (data.category !== 'ไม่ใช่ขยะ' && !data.category.includes('ไม่ใช่ขยะ')) {
          const id = Date.now().toString();
          const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substring(2, 9);
          if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
          
          const newRecord = { ...data, id, userId, date: new Date().toISOString(), isDisposed: false, mode, imageConsent: allowImageUpload };
          
          // Save to LocalStorage
          let history = [];
          try {
            history = JSON.parse(localStorage.getItem('wasteHistory') || '[]');
          } catch(e) {
            history = [];
          }
          localStorage.setItem('wasteHistory', JSON.stringify([newRecord, ...history]));
          currentRecord = newRecord;

          // Save to Server Database (Vercel KV & Blob)
          try {
            fetch('/api/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add',
                record: newRecord,
                imageBase64: allowImageUpload ? compressedImage : null,
                allowImageUpload
              }),
            });
          } catch (e) {
            console.error('Failed to sync with server', e);
          }
        }
        
        // Pass result via sessionStorage for the result page
        sessionStorage.setItem('currentResult', JSON.stringify(currentRecord));
        router.push('/result');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
        setIsAnalyzing(false);
      }
    } catch (error: any) {
      console.error("Client Analysis Error:", error);
      alert(`เกิดข้อผิดพลาดในการวิเคราะห์: ${error.message || 'โปรดลองใหม่อีกครั้ง'}`);
      setIsAnalyzing(false);
    }
  };

  if (showAdmin) {
    return <AdminDashboard onExit={() => setShowAdmin(false)} />;
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto font-sans bg-gray-50">
      <header className="mb-8 text-center pt-4">
        <h1 className="text-4xl font-extrabold text-green-700 mb-3 tracking-tight">AI Waste Sorter</h1>
        <p className="text-gray-600 mb-4 text-lg">ระบบช่วยแยกขยะอัจฉริยะด้วย AI</p>
        <span className="text-sm font-semibold text-green-700 bg-green-100 px-5 py-2 rounded-full shadow-sm">
          สแกน • วิเคราะห์ • จัดการ • ติดตาม
        </span>
      </header>

      {/* Stats Dashboard */}
      <section className="mb-6">
        {mode === 'general' ? (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-green-800 flex items-center">
              📊 สถิติการแยกขยะของคุณ (ส่วนตัว)
            </h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
              <StatCard title="สแกนทั้งหมด" value={stats.totalScanned} icon={Package} color="text-indigo-600" />
              <StatCard title="จัดการแล้ว" value={stats.total} icon={CheckCircle} color="text-green-600" />
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <StatCard title="รีไซเคิล" value={stats.recycle} icon={Recycle} color="text-emerald-500" />
              <StatCard title="ทั่วไป" value={stats.general} icon={Trash2} color="text-gray-500" />
              <StatCard title="อันตราย" value={stats.hazardous} icon={AlertTriangle} color="text-red-500" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-blue-800 flex items-center">
              🏫 สถิติภาพรวมโรงเรียน
            </h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
              <StatCard title="สแกนทั้งหมด" value={schoolStats.totalScanned} icon={Package} color="text-indigo-600" />
              <StatCard title="จัดการแล้ว" value={schoolStats.totalDisposed} icon={CheckCircle} color="text-blue-600" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <StatCard title="รีไซเคิล" value={schoolStats.recycle} icon={Recycle} color="text-emerald-500" />
              <StatCard title="ทั่วไป" value={schoolStats.general} icon={Trash2} color="text-gray-500" />
              <StatCard title="เศษอาหาร" value={schoolStats.organic} icon={Package} color="text-yellow-600" />
              <StatCard title="อันตราย" value={schoolStats.hazardous} icon={AlertTriangle} color="text-red-500" />
            </div>
          </div>
        )}
      </section>

      {/* Daily Tip */}
      <section className="mb-10 bg-green-50/80 p-5 md:p-6 rounded-2xl border border-green-200 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 shadow-sm">
        <div className="text-4xl bg-white p-3 rounded-full shadow-sm shrink-0">🌱</div>
        <div>
          <h3 className="text-base font-bold text-green-800 mb-1">เคล็ดลับแยกขยะวันนี้</h3>
          <p className="text-green-700 font-medium text-sm md:text-base leading-relaxed">{dailyTip}</p>
        </div>
      </section>

      {/* Mode Selection */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-5 text-gray-800 flex items-center">
          เลือกโหมดการใช้งาน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setMode('general')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              mode === 'general' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center mb-2">
              <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center border-2 ${mode === 'general' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                {mode === 'general' && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
              <h3 className={`text-lg font-bold ${mode === 'general' ? 'text-green-800' : 'text-gray-700'}`}>โหมดทั่วไป</h3>
            </div>
            <p className="text-gray-500 text-sm ml-8 leading-relaxed">ช่วยผู้ใช้แยกและจัดการขยะในชีวิตประจำวัน</p>
          </div>

          <div 
            onClick={() => setMode('school')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              mode === 'school' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center mb-2">
              <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center border-2 ${mode === 'school' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                {mode === 'school' && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
              <h3 className={`text-lg font-bold ${mode === 'school' ? 'text-blue-800' : 'text-gray-700'}`}>โหมดโรงเรียน</h3>
            </div>
            <p className="text-gray-500 text-sm ml-8 leading-relaxed">ช่วยจัดการขยะในโรงเรียนและสรุปข้อมูลการใช้งาน</p>
          </div>
        </div>
      </section>

      {/* Input Method */}
      <section className="mb-4">
        <h2 className="text-xl font-bold mb-5 text-gray-800 flex items-center">
          สแกนเพื่อแยกประเภท
        </h2>
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-center space-x-3 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit mx-auto">
            <button
              onClick={() => setInputMethod('camera')}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                inputMethod === 'camera' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📷 ถ่ายภาพ
            </button>
            <button
              onClick={() => setInputMethod('upload')}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                inputMethod === 'upload' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📁 อัปโหลด
            </button>
          </div>

          <div className="flex items-center justify-center mb-6">
            <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              <input
                type="checkbox"
                checked={allowImageUpload}
                onChange={(e) => setAllowImageUpload(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span>ยินยอมให้ระบบบันทึกภาพเพื่อใช้ในการศึกษาและสถิติ</span>
            </label>
          </div>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-6"></div>
              <p className="text-lg font-bold text-gray-700">กำลังวิเคราะห์ภาพขยะด้วย AI...</p>
              <p className="text-sm text-gray-400 mt-2">โปรดรอสักครู่ (อาจใช้เวลา 5-10 วินาที)</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl">
              {inputMethod === 'camera' ? (
                <Camera onCapture={handleImageSubmit} />
              ) : (
                <UploadBox onUpload={handleImageSubmit} />
              )}
            </div>
          )}
        </div>
      </section>
      
      <footer className="mt-12 text-center pb-8">
        <button 
          onClick={() => setShowAdmin(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition underline-offset-4 hover:underline"
        >
          Admin Login
        </button>
      </footer>
    </main>
  );
}
