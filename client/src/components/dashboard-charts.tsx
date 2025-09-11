import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { initializeChart } from "@/lib/charts";
import type { DashboardData } from "@shared/schema";

interface DashboardChartsProps {
  monthlyData: DashboardData["monthlyData"];
  expenseCategories: DashboardData["expenseCategories"];
}

export default function DashboardCharts({ monthlyData, expenseCategories }: DashboardChartsProps) {
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const expenseChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (revenueChartRef.current && monthlyData.length > 0) {
      const ctx = revenueChartRef.current.getContext('2d');
      if (ctx) {
        initializeChart(ctx, 'bar', {
          labels: monthlyData.map(d => d.month),
          datasets: [
            {
              label: 'Gelir',
              data: monthlyData.map(d => d.income),
              backgroundColor: 'hsl(217, 91%, 60%)',
              borderRadius: 4
            },
            {
              label: 'Gider',
              data: monthlyData.map(d => d.expenses),
              backgroundColor: 'hsl(0, 84%, 60%)',
              borderRadius: 4
            }
          ]
        }, {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return '₺' + value.toLocaleString('tr-TR');
                }
              }
            }
          }
        });
      }
    }
  }, [monthlyData]);

  useEffect(() => {
    if (expenseChartRef.current && expenseCategories.length > 0) {
      const ctx = expenseChartRef.current.getContext('2d');
      if (ctx) {
        initializeChart(ctx, 'doughnut', {
          labels: expenseCategories.map(c => c.category),
          datasets: [{
            data: expenseCategories.map(c => c.percentage),
            backgroundColor: [
              'hsl(217, 91%, 60%)',
              'hsl(173, 58%, 39%)',
              'hsl(197, 37%, 24%)',
              'hsl(43, 74%, 66%)',
              'hsl(27, 87%, 67%)'
            ],
            borderWidth: 0
          }]
        }, {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const
            }
          }
        });
      }
    }
  }, [expenseCategories]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Revenue Chart */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Aylık Gelir/Gider</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" data-testid="button-chart-6months">
                6 Ay
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-chart-1year">
                1 Yıl
              </Button>
            </div>
          </div>
          <div className="h-64">
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <i className="fas fa-chart-bar text-4xl mb-2"></i>
                  <p>Veri bulunamadı</p>
                </div>
              </div>
            ) : (
              <canvas 
                ref={revenueChartRef} 
                className="w-full h-full"
                data-testid="chart-monthly-revenue"
              ></canvas>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Gider Kategorileri</h3>
            <Button variant="ghost" size="sm" data-testid="button-expense-detail">
              Detay
            </Button>
          </div>
          <div className="h-64">
            {expenseCategories.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <i className="fas fa-chart-pie text-4xl mb-2"></i>
                  <p>Veri bulunamadı</p>
                </div>
              </div>
            ) : (
              <canvas 
                ref={expenseChartRef} 
                className="w-full h-full"
                data-testid="chart-expense-categories"
              ></canvas>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
