import React from 'react';

// Stateless card with asymmetric radius variants used across the app.
const Card = ({ children, className = '', variant = 'standard' }) => {
  const baseClasses = 'card';
  const variants = {
    standard: '',
    inverse: 'card-inverse',
    soft: 'card-soft',
  };

  return <div className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</div>;
};

export default Card;
