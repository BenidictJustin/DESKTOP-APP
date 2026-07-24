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
        <div className="min-h-screen w-screen flex flex-col items-center justify-center p-6 text-center font-poppins">
          <div className="glass-modal rounded-2xl p-8 max-w-lg shadow-glass-xl border border-white/80 text-gray-800 animate-fade-in-scale">
            <div className="h-14 w-14 bg-error-50 text-error-600 rounded-xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold border border-error-100">
              !
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight">DommUnity App Rendering Alert</h2>
            <p className="text-sm text-gray-500 mb-4">
              A runtime component exception occurred. To prevent a blank white screen, this safe-mode boundary has paused rendering.
            </p>
            <div className="bg-error-50 text-error-700 text-[11px] font-mono p-3.5 rounded-lg text-left max-h-40 overflow-auto mb-6 border border-error-100">
              {this.state.error?.toString()}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="bg-navy-blue hover:bg-navy-blue-600 text-white text-sm font-semibold py-2.5 px-5 rounded-xl shadow-glass-sm hover:shadow-md transition-all duration-150 cursor-pointer border border-white/20"
              >
                Refresh App
              </button>
              <button
                onClick={this.handleReset}
                className="bg-white/80 hover:bg-white text-navy-blue text-sm font-semibold py-2.5 px-5 rounded-xl transition-all duration-150 cursor-pointer border border-gray-200"
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
