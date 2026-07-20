import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught app rendering exception captured by ErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('dommunity_current_user');
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white rounded-3xl p-8 max-w-lg shadow-2xl border border-red-100 text-gray-800 animate-in fade-in duration-300">
            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">DommUnity App Rendering Alert</h2>
            <p className="text-sm text-gray-500 mb-4">
              A runtime component exception occurred. To prevent a blank white screen, this safe-mode boundary has paused rendering.
            </p>
            <div className="bg-red-50 text-red-800 text-[11px] font-mono p-3 rounded-lg text-left max-h-40 overflow-auto mb-6 border border-red-200">
              {this.state.error?.toString()}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-5 rounded-full transition cursor-pointer"
              >
                Refresh App
              </button>
              <button
                onClick={this.handleReset}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold py-2 px-5 rounded-full transition cursor-pointer"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
