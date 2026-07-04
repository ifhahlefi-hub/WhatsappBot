import React, { useMemo } from 'react';

const SOFT_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-red-100 text-red-700',
  'bg-teal-100 text-teal-700',
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorIndex(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % SOFT_COLORS.length;
}

export default function Avatar({ src, name, className = "w-10 h-10 text-sm" }) {
  const colorClass = useMemo(() => SOFT_COLORS[getColorIndex(name || 'Unknown')], [name]);
  const initials = useMemo(() => getInitials(name), [name]);

  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`rounded-full object-cover shadow-sm ring-1 ring-gray-100 ${className}`} 
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div className={`rounded-full flex items-center justify-center font-semibold shadow-sm ring-1 ring-gray-100 ${colorClass} ${className}`}>
      {initials}
    </div>
  );
}
