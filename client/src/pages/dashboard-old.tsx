import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardCharts from "@/components/dashboard-charts";
import { useDashboardData } from "@/hooks/useSheets";

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-4">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Dashboard Verisi Yüklenemedi</h3>
            <p className="text-muted-foreground mb-4">Dashboard verilerini yüklerken bir hata oluştu.</p>
            <Button onClick={() => window.location.reload()} data-testid="button-retry-dashboard">
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground mb-4">
              <i className="fas fa-chart-line text-4xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Dashboard Verisi Bulunamadı</h3>
            <p className="text-muted-foreground">Henüz görüntülenecek veri bulunmuyor.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (current: number, previous: number) => {
    if (previous === 0) return "+0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-income">
                  {formatCurrency(dashboardData.totalIncome)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  +12.5% bu ay
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <i className="fas fa-arrow-trend-up text-green-600 h-6 w-6"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Gider</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-expenses">
                  {formatCurrency(dashboardData.totalExpenses)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  +8.2% bu ay
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <i className="fas fa-arrow-trend-down text-red-600 h-6 w-6"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Kâr</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-net-profit">
                  {formatCurrency(dashboardData.netProfit)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <i className="fas fa-arrow-up mr-1"></i>
                  +24.3% bu ay
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <i className="fas fa-chart-pie text-blue-600 h-6 w-6"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktif Projeler</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-projects">
                  {dashboardData.activeProjects}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <i className="fas fa-plus mr-1"></i>
                  2 yeni proje
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <i className="fas fa-building text-orange-600 h-6 w-6"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <DashboardCharts 
        monthlyData={dashboardData.monthlyData}
        expenseCategories={dashboardData.expenseCategories}
      />

      {/* Active Projects */}
      <Card className="shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Aktif Projeler</h3>
            <Button className="text-sm" data-testid="button-add-project">
              <i className="fas fa-plus h-4 w-4 mr-2"></i>
              Yeni Proje
            </Button>
          </div>
        </div>
        <CardContent className="p-6">
          {dashboardData.projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <i className="fas fa-building text-4xl"></i>
              </div>
              <h4 className="text-lg font-medium text-foreground mb-2">Henüz Proje Yok</h4>
              <p className="text-muted-foreground">İlk projenizi oluşturmak için yukarıdaki butona tıklayın.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`card-project-${project.id}`}>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground" data-testid={`text-project-name-${project.id}`}>
                      {project.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {project.startDate && project.endDate && (
                        <>
                          Başlangıç: {new Date(project.startDate).toLocaleDateString('tr-TR')} | 
                          Hedef Bitiş: {new Date(project.endDate).toLocaleDateString('tr-TR')}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground" data-testid={`text-project-spent-${project.id}`}>
                        {formatCurrency(Number(project.spent || 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Harcama</p>
                    </div>
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>İlerleme</span>
                        <span data-testid={`text-project-progress-${project.id}`}>{project.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${project.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${project.progress}%` }}
                          data-testid={`progress-project-${project.id}`}
                        ></div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid={`button-view-project-${project.id}`}>
                      <i className="fas fa-arrow-right h-4 w-4"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
