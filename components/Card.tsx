
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
  // Check if className includes custom background or border to avoid conflicts
  const hasCustomBg = className.includes('bg-[') || 
                      (className.includes('bg-') && 
                       !className.match(/\bbg-white\b/) && 
                       !className.match(/\bbg-transparent\b/));
  const hasCustomBorder = className.includes('border-none') || 
                          className.includes('!border-none') ||
                          className.match(/\bborder-\[/);
  
  // Build base classes - only add defaults if not overridden
  let baseClasses = 'rounded-2xl shadow-sm';
  
  // Only add default padding if not specified in className
  if (!className.includes('p-')) {
    baseClasses += ' p-6';
  }
  
  if (!hasCustomBg) {
    baseClasses += ' bg-white';
  }
  
  if (!hasCustomBorder) {
    baseClasses += ' border border-slate-100';
  }
  
  if (hoverEffect) {
    baseClasses += ' hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer';
  }
  
  // Append custom className last so it can override defaults with Tailwind's class order
  baseClasses += ` ${className}`;
  
  return (
    <div 
      className={baseClasses.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  );
};