import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'light' | 'dark' | 'danger';
  children: ReactNode;
}

export function Button({ variant = 'light', children, className, ...props }: ButtonProps) {
  const variantClass = styles[variant] ?? '';

  return (
    <button className={`${styles.btn} ${variantClass} ${className ?? ''}`.trim()} {...props}>
      {children}
    </button>
  );
}