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
  const baseClasses = 'btn';
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'bg-transparent text-neutral-grayText hover:bg-gray-100',
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
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

export default Button;
