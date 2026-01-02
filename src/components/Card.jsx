import React from "react";

// Stateless card with asymmetric radius variants used across the app.
const Card = ({ children, className = "", variant = "standard" }) => {
  const baseClasses = "bg-white p-6 transition-all duration-300";
  const variants = {
    standard: "shadow-[0px_4px_50px_rgba(128,128,128,0.15)] rounded-tr-[48px] rounded-bl-[48px]",
    inverse: "shadow-[0px_4px_50px_rgba(128,128,128,0.15)] rounded-tl-[48px] rounded-br-[48px]",
    soft: "shadow-[0px_4px_25px_rgba(128,128,128,0.15)] rounded-[15px]",
  };

  return <div className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</div>;
};

export default Card;
