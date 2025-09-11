declare global {
  interface Window {
    Chart: any;
  }
}

// Load Chart.js from CDN if not already loaded
function loadChartJS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Chart.js'));
    document.head.appendChild(script);
  });
}

export async function initializeChart(
  ctx: CanvasRenderingContext2D,
  type: string,
  data: any,
  options: any = {}
) {
  try {
    await loadChartJS();
    
    // Destroy existing chart if it exists
    const existingChart = window.Chart.getChart(ctx.canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    return new window.Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options
      }
    });
  } catch (error) {
    console.error('Error initializing chart:', error);
    return null;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
