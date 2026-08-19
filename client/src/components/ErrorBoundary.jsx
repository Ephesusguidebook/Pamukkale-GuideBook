import { Component } from 'react';

// Catches unexpected render errors so the visitor sees a friendly message
// instead of a blank white screen; the site never fully crashes.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Hook up an error tracking service (e.g. Sentry) here if desired.
    console.error('Render error caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Something went wrong</h1>
          <p className="max-w-md text-gray-600">
            An unexpected error occurred while loading the page. You can head back to the
            homepage and try again.
          </p>
          <button onClick={this.handleReset} className="btn-primary">
            Back to homepage
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
