'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an analytics service
    console.error('App Crashed:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-red-50 text-red-900">
      <h2 className="text-3xl font-bold mb-4">ระบบเกิดข้อผิดพลาด (Crash) 😢</h2>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full border border-red-200">
        <p className="font-semibold text-lg mb-2">รายละเอียด Error (รบกวนแคปหน้านี้ส่งให้โปรแกรมเมอร์ทีครับ):</p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm mb-4 whitespace-pre-wrap">
          {error.name}: {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            reset();
            window.location.reload();
          }}
          className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 w-full font-bold shadow-sm"
        >
          ล้างข้อมูลทั้งหมดแล้วรีเฟรช (Clear Data & Restart)
        </button>
      </div>
    </div>
  );
}
