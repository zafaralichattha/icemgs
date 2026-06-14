import { useState, useEffect } from 'react';
import { AlertCircle, Server } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function BackendStatusBanner() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Hit the API base URL directly to check if server is responding.
      // We append a slash to prevent Django 301 redirects which might cause CORS issues
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
      const checkUrl = baseUrl + 'health-check/';

      const response = await fetch(checkUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online' && data.database === 'connected') {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      console.log('Backend check failed:', error);
      setBackendStatus('offline');
    }
  };

  if (backendStatus === 'checking') {
    return null;
  }

  if (backendStatus === 'online') {
    return null; // Don't show anything when backend is connected (clean production UX)
  }

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 mb-1">
              Backend Server Not Running
            </p>
            <p className="text-xs text-red-800 mb-2">
              The Django backend at <code className="bg-red-100 px-1 py-0.5 rounded">{API_BASE_URL}</code> is not responding.
            </p>
            <details className="text-xs text-red-800">
              <summary className="cursor-pointer font-medium hover:text-red-900 mb-1">
                Quick Setup Guide
              </summary>
              <div className="mt-2 space-y-1 pl-4 border-l-2 border-red-300">
                <p>1. Open a terminal and navigate to the backend folder</p>
                <p>2. Install dependencies: <code className="bg-red-100 px-1 py-0.5 rounded">pip install -r requirements.txt</code></p>
                <p>3. Run migrations: <code className="bg-red-100 px-1 py-0.5 rounded">python manage.py migrate</code></p>
                <p>4. Start server: <code className="bg-red-100 px-1 py-0.5 rounded">python manage.py runserver</code></p>
                <p className="mt-2">📖 See <code className="bg-red-100 px-1 py-0.5 rounded">BACKEND_SETUP_INSTRUCTIONS.md</code> for full details</p>
              </div>
            </details>
          </div>
          <button
            onClick={checkBackendStatus}
            className="flex-shrink-0 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors flex items-center gap-1"
          >
            <Server className="w-3 h-3" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
