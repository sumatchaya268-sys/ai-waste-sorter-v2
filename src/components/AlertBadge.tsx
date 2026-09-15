import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AlertBadgeProps {
  message: string;
  type?: 'warning' | 'error' | 'info';
}

export default function AlertBadge({ message, type = 'error' }: AlertBadgeProps) {
  const colors = {
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className={`flex items-center p-4 mb-4 border rounded-lg ${colors[type]}`} role="alert">
      <AlertCircle className="flex-shrink-0 w-5 h-5 mr-2" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
