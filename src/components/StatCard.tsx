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
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left sm:space-x-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`p-2.5 md:p-3 rounded-full bg-gray-50 mb-2 sm:mb-0 ${color}`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <div>
        <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
