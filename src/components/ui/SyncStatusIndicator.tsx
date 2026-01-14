import { useSyncState } from '@/features/sync';
import styles from './SyncStatusIndicator.module.css';

interface SyncStatusIndicatorProps {
  showTime?: boolean;
  className?: string;
}

export function SyncStatusIndicator({ showTime = true, className = '' }: SyncStatusIndicatorProps) {
  const { combinedStatus, lastSyncedAtFormatted } = useSyncState();

  const statusConfig = {
    idle: {
      label: '同期済み',
      icon: <CheckIcon />,
    },
    syncing: {
      label: '同期中...',
      icon: <SyncIcon className={styles.spin} />,
    },
    error: {
      label: '同期エラー',
      icon: <ErrorIcon />,
    },
    offline: {
      label: 'オフライン',
      icon: <OfflineIcon />,
    },
  };

  const config = statusConfig[combinedStatus];

  return (
    <div className={`${styles.container} ${styles[combinedStatus]} ${className}`}>
      <span className={styles.icon}>{config.icon}</span>
      <span className={styles.text}>{config.label}</span>
      {showTime && combinedStatus === 'idle' && lastSyncedAtFormatted && (
        <span className={styles.time}>({lastSyncedAtFormatted})</span>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06l2.75 2.75 6.72-6.72a.75.75 0 0 1 1.06 0z" />
    </svg>
  );
}

function SyncIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 2a6 6 0 0 0-6 6h1.5A4.5 4.5 0 0 1 8 3.5V2zm0 12a6 6 0 0 0 6-6h-1.5A4.5 4.5 0 0 1 8 12.5V14zM2 8a6 6 0 0 1 .23-1.64l1.44.5A4.5 4.5 0 0 0 3.5 8H2zm12 0a6 6 0 0 1-.23 1.64l-1.44-.5A4.5 4.5 0 0 0 12.5 8H14z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm.75-3.75a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 1.5 0v4.5z" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm4.22 2.22a.75.75 0 0 1 1.06 0L8 12.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 0 1 0-1.06zM8 3.06l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.25-3.25a.75.75 0 0 0-1.06 0L4.22 4.72a.75.75 0 0 0 1.06 1.06L8 3.06z" />
    </svg>
  );
}
