'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-lg text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-800 mb-2">حدث خطأ في لوحة التحكم</h2>
        <p className="text-sm text-gray-600 mb-2">
          {error?.message || 'حدث خطأ غير متوقع أثناء تحميل الصفحة'}
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-400 mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
