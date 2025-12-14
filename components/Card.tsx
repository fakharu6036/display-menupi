import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-100/60 shadow-lg shadow-slate-100/50 backdrop-blur-sm p-6 ${hoverEffect ? 'hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};