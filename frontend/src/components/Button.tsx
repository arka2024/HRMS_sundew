import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth, 
  className = '', 
  ...props 
}) => {
  const baseClass = `btn btn-${variant}`;
  const widthClass = fullWidth ? 'full-width' : '';
  
  return (
    <button 
      className={`${baseClass} ${widthClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </button>
  );
};
