import { Component } from 'react';

// Beklenmeyen bir render hatası olursa kullanıcıya boş beyaz ekran yerine
// anlaşılır bir mesaj gösterir; site tamamen çökmez.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // İstersen burada bir hata izleme servisine (Sentry vb.) log gönderebilirsin.
    console.error('Render hatası yakalandı:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Bir şeyler ters gitti</h1>
          <p className="max-w-md text-gray-600">
            Sayfa yüklenirken beklenmeyen bir hata oluştu. Ana sayfaya dönüp tekrar
            deneyebilirsin.
          </p>
          <button onClick={this.handleReset} className="btn-primary">
            Ana sayfaya dön
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
