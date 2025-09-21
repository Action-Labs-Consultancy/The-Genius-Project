import React from 'react';

interface IsolatedInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export const IsolatedInput: React.FC<IsolatedInputProps> = ({ 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  className, 
  rows 
}) => {
  const baseClassName =
    className || 'w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  if (type === 'textarea') {
    return (
      <textarea
        value={value ?? ''}
        onChange={handleChange}
        rows={rows || 3}
        className={baseClassName}
        placeholder={placeholder}
      />
    );
  }

  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={handleChange}
      className={baseClassName}
      placeholder={placeholder}
    />
  );
};