import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'default' | 'small';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  size = 'default',
  children,
  className = '',
}: BadgeProps) {
  const sizeClass = size === 'small' ? styles.small : '';
  return (
    <span className={`${styles.badge} ${styles[variant]} ${sizeClass} ${className}`}>
      {children}
    </span>
  );
}
