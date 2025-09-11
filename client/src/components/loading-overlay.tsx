export default function LoadingOverlay() {
  return (
    <div id="loading-overlay" className="fixed inset-0 z-40 hidden items-center justify-center bg-black bg-opacity-30" data-testid="loading-overlay">
      <div className="bg-card p-6 rounded-lg shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-foreground">Veriler yükleniyor...</span>
        </div>
      </div>
    </div>
  );
}
