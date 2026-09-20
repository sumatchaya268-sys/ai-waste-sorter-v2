'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-red-50 text-red-900">
          <h2 className="text-3xl font-bold mb-4">ระบบเกิดข้อผิดพลาดร้ายแรง (Global Crash)</h2>
          <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full border border-red-200">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm mb-4 whitespace-pre-wrap">
              {error.name}: {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 w-full"
            >
              Clear & Restart
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
