import React from 'react';

// Reusable button variants matching the app's visual language.
const Button = ({
  onClick,
  children,
  variant = 'primary',
  className = '',
  size = 'md',
  disabled = false,
  type = 'button',
}) => {
  const base =
    'font-bold transition-all duration-250 flex items-center justify-center gap-2 active:scale-95';

  const variants = {
    primary: 'bg-[#FFA400] text-white hover:shadow-[0px_10px_20px_rgba(255,164,0,0.2)]',
    secondary: 'bg-white text-black shadow-[0px_4px_25px_rgba(128,128,128,0.15)] hover:bg-gray-50',
    outline:
      'border-2 border-[#FFA400] text-[#FFA400] bg-transparent hover:bg-[#FFA400] hover:text-white',
    ghost: 'bg-transparent text-[#5C5C5C] hover:bg-gray-100',
    danger: 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100',
  };

  const sizes = {
    xs: 'py-1 px-3 text-xs rounded-md',
    sm: 'py-2 px-4 text-sm rounded-lg',
    md: 'py-3 px-6 text-base rounded-xl',
    lg: 'py-4 px-8 text-lg rounded-2xl',
    xl: 'py-6 px-8 text-xl rounded-2xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

export default Button;
