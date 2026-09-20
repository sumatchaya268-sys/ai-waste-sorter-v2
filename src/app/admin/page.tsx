'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, CheckCircle, Recycle, Trash2, AlertTriangle, Search, X } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { WasteRecord } from '@/lib/db';

export default function AdminDashboard() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'general' | 'school'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<WasteRecord | null>(null);

  // Check if already logged in via sessionStorage
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminPassword');
    if (savedPassword) {
      setPassword(savedPassword);
      handleLogin(savedPassword);
    }
  }, []);

  const handleLogin = async (pass: string = password) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/records', {
        headers: {
          'Authorization': `Bearer ${pass}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
        setIsLoggedIn(true);
        sessionStorage.setItem('adminPassword', pass);
      } else {
        setError('รหัสผ่านไม่ถูกต้อง');
        sessionStorage.removeItem('adminPassword');
      }
    } catch (e) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminPassword');
    setIsLoggedIn(false);
    setPassword('');
    setRecords([]);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Login</h1>
            <p className="text-gray-500">กรุณาเข้าสู่ระบบเพื่อดูข้อมูลสถิติทั้งหมด</p>
          </div>
          
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none mb-4 transition"
          />
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <button
            onClick={() => handleLogin()}
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 mt-3 text-gray-500 hover:bg-gray-100 rounded-xl transition"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  const filteredRecords = records.filter(record => {
    if (filterMode !== 'all' && record.mode !== filterMode) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        record.userId.toLowerCase().includes(q) ||
        record.itemName.toLowerCase().includes(q) ||
        record.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    totalScans: filteredRecords.length,
    totalDisposed: filteredRecords.filter(r => r.isDisposed).length,
    recycle: filteredRecords.filter(r => r.isDisposed && r.category.includes('รีไซเคิล')).length,
    general: filteredRecords.filter(r => r.isDisposed && r.category.includes('ทั่วไป')).length,
    hazardous: filteredRecords.filter(r => r.isDisposed && r.category.includes('อันตราย')).length,
    organic: filteredRecords.filter(r => r.isDisposed && r.category.includes('เปียก')).length,
  const [showSettings, setShowSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });
  const [changingPwd, setChangingPwd] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setSettingsMsg({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
      return;
    }
    
    if (newPassword.length < 4) {
      setSettingsMsg({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร' });
      return;
    }

    setChangingPwd(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        sessionStorage.setItem('adminPassword', newPassword); // Update current session
      } else {
        setSettingsMsg({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (error) {
      setSettingsMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    }
    setChangingPwd(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">🛠️ Admin Dashboard</h1>
        <div className="flex space-x-2 md:space-x-4">
          <button onClick={() => handleLogin(sessionStorage.getItem('adminPassword') || password)} className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition text-sm md:text-base">
            🔄 รีเฟรช
          </button>
          <button onClick={() => setShowSettings(true)} className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition text-sm md:text-base">
            ⚙️ ตั้งค่า
          </button>
          <button onClick={handleLogout} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition text-sm md:text-base">
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setFilterMode('all')} className={`px-4 py-2 rounded-md font-medium text-sm transition ${filterMode === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>ทั้งหมด</button>
            <button onClick={() => setFilterMode('general')} className={`px-4 py-2 rounded-md font-medium text-sm transition ${filterMode === 'general' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>โหมดทั่วไป</button>
            <button onClick={() => setFilterMode('school')} className={`px-4 py-2 rounded-md font-medium text-sm transition ${filterMode === 'school' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>โหมดโรงเรียน</button>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="ค้นหา (User ID, ชื่อขยะ)..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <StatCard title="สแกนทั้งหมด" value={stats.totalScans} icon={Package} color="text-indigo-600" />
          <StatCard title="จัดการแล้ว" value={stats.totalDisposed} icon={CheckCircle} color="text-blue-600" />
          <StatCard title="รีไซเคิล" value={stats.recycle} icon={Recycle} color="text-green-600" />
          <StatCard title="ทั่วไป" value={stats.general} icon={Trash2} color="text-gray-600" />
          <StatCard title="ขยะเปียก" value={stats.organic} icon={Package} color="text-yellow-600" />
          <StatCard title="อันตราย" value={stats.hazardous} icon={AlertTriangle} color="text-red-600" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold">วันที่ / เวลา</th>
                  <th className="p-4 font-semibold">ขยะที่สแกน</th>
                  <th className="p-4 font-semibold">หมวดหมู่</th>
                  <th className="p-4 font-semibold">โหมด</th>
                  <th className="p-4 font-semibold">สถานะ</th>
                  <th className="p-4 font-semibold">แอคชัน</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">ไม่พบข้อมูลการสแกน</td>
                  </tr>
                ) : (
                  filteredRecords.map(record => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4 font-mono text-xs text-gray-500">{record.userId}</td>
                      <td className="p-4 text-sm text-gray-700">{new Date(record.date).toLocaleString('th-TH')}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">{record.itemName}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          record.category.includes('รีไซเคิล') ? 'bg-green-100 text-green-700' :
                          record.category.includes('อันตราย') ? 'bg-red-100 text-red-700' :
                          record.category.includes('เปียก') ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {record.category}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{record.mode === 'school' ? 'โรงเรียน' : 'ทั่วไป'}</td>
                      <td className="p-4 text-sm">
                        {record.isDisposed ? (
                          <span className="flex items-center text-green-600 text-xs font-bold"><CheckCircle className="w-3 h-3 mr-1"/> จัดการแล้ว</span>
                        ) : (
                          <span className="text-gray-400 text-xs">ยังไม่จัดการ</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedRecord(record)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">รายละเอียดการสแกน</h3>
              <button onClick={() => setSelectedRecord(null)} className="p-1 hover:bg-gray-200 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {selectedRecord.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedRecord.imageUrl} alt="Waste" className="w-full h-48 object-cover rounded-xl mb-4 bg-gray-100 border border-gray-200" />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-gray-100 rounded-xl mb-4 border border-dashed border-gray-300">
                  <p className="text-gray-400 text-sm">ผู้ใช้ไม่ยินยอมให้เก็บภาพ</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">User ID</p>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-100">{selectedRecord.userId}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ชื่อขยะ</p>
                    <p className="font-bold text-gray-900">{selectedRecord.itemName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">หมวดหมู่</p>
                    <p className="font-medium text-blue-600">{selectedRecord.category}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">คำแนะนำที่ระบบให้ไป</p>
                  <p className="text-sm text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 whitespace-pre-wrap">{selectedRecord.disposalSteps}</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">เวลาที่สแกน</p>
                    <p className="text-sm font-medium text-gray-700">{new Date(selectedRecord.date).toLocaleString('th-TH')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">สถานะ</p>
                    {selectedRecord.isDisposed ? (
                      <span className="text-green-600 font-bold text-sm flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> ทิ้งเรียบร้อย</span>
                    ) : (
                      <span className="text-gray-400 font-medium text-sm">รอยืนยัน</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">⚙️ ตั้งค่าบัญชี (เปลี่ยนรหัสผ่าน)</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-200 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6">
              {settingsMsg.text && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${settingsMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {settingsMsg.text}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านปัจจุบัน</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium">
                  ยกเลิก
                </button>
                <button type="submit" disabled={changingPwd} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50">
                  {changingPwd ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
