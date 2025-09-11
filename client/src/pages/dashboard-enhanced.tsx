import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useSheets";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, error } = useDashboardData();

  // Show authentication prompt if not logged in
  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground mb-4">
              <i className="fas fa-sign-in-alt text-4xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Dashboard Erişimi</h3>
            <p className="text-muted-foreground mb-4">Dashboard verilerine erişmek için giriş yapmanız gerekiyor.</p>
            <Button onClick={() => window.location.href = '/login'}>
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  if (error || !dashboardData) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground mb-4">
              <i className="fas fa-exclamation-circle text-4xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Google Sheets Bağlantısı Gerekli</h3>
            <p className="text-muted-foreground mb-4">
              Dashboard verilerini görüntülemek için Google Sheets ile bağlantı kurmanız gerekiyor.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>Spreadsheet ID: 1gOjceZ4DxORlbD1rTiGxgxoATvmKLVsIhyeE8UPtdlU</p>
              <p>Bu spreadsheet'i paylaşım ayarlarından "Anyone with the link can edit" yapın</p>
              <p>Veya şu email ile paylaşın: 798083510172-itlqrd900a6a0mcq82ua4o6kimf42sil@gorkeminsaat.iam.gserviceaccount.com</p>
            </div>
            <Button onClick={() => window.location.reload()}>
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Hoş geldiniz, {user.email}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <i className="fas fa-table text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Sheet</p>
                <p className="text-2xl font-bold text-foreground">{dashboardData.totalSheets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <i className="fas fa-arrow-up text-green-600 dark:text-green-400"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gelir</p>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardData.stats?.income?.toLocaleString('tr-TR') || '0'} ₺
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <i className="fas fa-arrow-down text-red-600 dark:text-red-400"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gider</p>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardData.stats?.expenses?.toLocaleString('tr-TR') || '0'} ₺
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <i className="fas fa-project-diagram text-purple-600 dark:text-purple-400"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projeler</p>
                <p className="text-2xl font-bold text-foreground">{dashboardData.stats?.projects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hızlı İşlemler</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/sheets/new'}>
                <i className="fas fa-plus mr-2"></i>
                Yeni Sheet Oluştur
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.reload()}>
                <i className="fas fa-sync mr-2"></i>
                Verileri Yenile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Son Aktiviteler</h3>
            {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {activity.description}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Henüz aktivite bulunmuyor.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
