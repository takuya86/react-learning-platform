import { Component, type ReactNode } from 'react';
import { logger } from '@/lib/logger';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch React errors and display a fallback UI
 *
 * Features:
 * - Logs errors with logger integration
 * - Customizable fallback UI
 * - Error recovery with reset functionality
 * - GitHub issue reporting link
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error with full context
    logger.error('React ErrorBoundary caught error', {
      category: 'general',
      context: {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        name: error.name,
      },
    });

    // Update state with error info for display
    this.setState({
      errorInfo,
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!, this.resetError);
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1 className="error-boundary-title">エラーが発生しました</h1>
            <p className="error-boundary-message">
              申し訳ございません。予期しないエラーが発生しました。
            </p>

            <div className="error-boundary-details">
              <h2>エラー詳細</h2>
              <div className="error-boundary-error-info">
                <strong>{this.state.error.name}:</strong> {this.state.error.message}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                <details className="error-boundary-stack">
                  <summary>スタックトレース</summary>
                  <pre>{this.state.error.stack}</pre>
                </details>
              )}

              {process.env.NODE_ENV === 'development' && this.state.errorInfo?.componentStack && (
                <details className="error-boundary-component-stack">
                  <summary>コンポーネントスタック</summary>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </details>
              )}
            </div>

            <div className="error-boundary-actions">
              <button
                className="error-boundary-button error-boundary-button-primary"
                onClick={this.resetError}
              >
                リトライ
              </button>

              <button
                className="error-boundary-button error-boundary-button-secondary"
                onClick={() => (window.location.href = '/')}
              >
                ホームに戻る
              </button>

              <a
                href={`https://github.com/takuyakawase/react-learning-platform/issues/new?title=${encodeURIComponent(`Error: ${this.state.error.message}`)}&labels=bug&body=${encodeURIComponent(`## エラー詳細\n\n**エラーメッセージ:**\n${this.state.error.message}\n\n**スタックトレース:**\n\`\`\`\n${this.state.error.stack || 'N/A'}\n\`\`\`\n\n**発生日時:**\n${new Date().toISOString()}\n\n**ブラウザ情報:**\n${navigator.userAgent}\n`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="error-boundary-button error-boundary-button-link"
              >
                問題を報告する
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
