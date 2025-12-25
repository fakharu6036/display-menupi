
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'filled', 
  size = 'md', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-30 disabled:cursor-not-allowed rounded-full active:scale-[0.97]";
  
  const variants = {
    filled: "bg-[#3f51b5] text-white hover:bg-[#34449a] shadow-sm focus:ring-[#3f51b5]/20",
    tonal: "bg-[#e1e2f6] text-[#191a2c] hover:bg-[#d0d1e9] focus:ring-[#3f51b5]/10",
    outlined: "bg-transparent text-[#3f51b5] border border-[#777680] hover:bg-[#3f51b5]/5 focus:ring-[#3f51b5]/10",
    text: "bg-transparent text-[#3f51b5] hover:bg-[#3f51b5]/5",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-100",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs h-8",
    md: "px-6 py-3 text-sm h-10",
    lg: "px-10 py-4 text-base h-14 w-full",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};
