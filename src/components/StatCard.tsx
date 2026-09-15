import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({ title, value, icon: Icon, color = 'text-blue-600' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 border border-gray-100">
      <div className={`p-3 rounded-full bg-gray-50 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
