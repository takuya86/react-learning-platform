import type { ReactNode, ComponentPropsWithoutRef } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'default' | 'small';

interface BadgeProps extends Omit<ComponentPropsWithoutRef<'span'>, 'className'> {
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
  ...rest
}: BadgeProps) {
  const sizeClass = size === 'small' ? styles.small : '';
  return (
    <span className={`${styles.badge} ${styles[variant]} ${sizeClass} ${className}`} {...rest}>
      {children}
    </span>
  );
}
