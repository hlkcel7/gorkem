import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinancialDashboard } from '@/components/financial-dashboard';
import { ProjectDashboard } from '@/components/project-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Building
} from 'lucide-react';

export function FinancialPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                Görkem İnşaat
              </h1>
              <p className="text-muted-foreground">
                Finansal Yönetim ve Analiz Sistemi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">
                <TrendingUp className="h-3 w-3 mr-1" />
                Aktif
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Projeler</span>
            </TabsTrigger>
            <TabsTrigger value="sheets" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Veri Tabloları</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Raporlar</span>
            </TabsTrigger>
          </TabsList>

          {/* Ana Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <FinancialDashboard />
          </TabsContent>

          {/* Veri Girişi */}
          <TabsContent value="entry" className="space-y-6">
            <FinancialDataEntry />
          </TabsContent>

          {/* Google Sheets Tablolar */}
                    <TabsContent value="dashboard" className="space-y-6">
            <FinancialDashboard />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <ProjectDashboard />
          </TabsContent>

          <TabsContent value="sheets" className="space-y-6">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Finansal Veri Tabloları</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Finansal verilerinizi yönetmek için sidebar'dan ilgili tabloları oluşturun ve düzenleyin.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="font-medium text-green-800">Temel Tablolar</h3>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>💰 Gelirler Tablosu</li>
                      <li>📊 Giderler Tablosu</li>
                      <li>🏦 Nakit Durumu</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="font-medium text-blue-800">Yönetim Tabloları</h3>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>🏗️ Proje Takip</li>
                      <li>⏰ Ödeme Planı</li>
                      <li>🏢 İştirakler</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <h3 className="font-medium text-purple-800">Dashboard KPI'ları</h3>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>📈 Toplam Gelir</li>
                      <li>📉 Toplam Gider</li>
                      <li>💎 Net Kar</li>
                      <li>💰 Nakit Pozisyon</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-1">Kullanım Talimatı</h4>
                      <p className="text-sm text-amber-700">
                        Sidebar'dan <strong>"Yeni Tablo Oluştur"</strong> butonuna tıklayarak finansal tablolarınızı oluşturun. 
                        Dashboard otomatik olarak bu tablolardan verileri çekerek KPI'ları hesaplayacaktır.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Raporlar Çok Yakında</h3>
              <p className="text-gray-500">
                Detaylı finansal raporlar ve analizler için geliştirme devam ediyor.
              </p>
            </div>
          </TabsContent>

          {/* Raporlar */}
          <TabsContent value="reports" className="space-y-6">
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Raporlar ve Analizler</h3>
              <p className="text-muted-foreground mb-6">
                Detaylı finansal raporlar yakında eklenecek
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Card className="text-left">
                  <CardHeader>
                    <CardTitle>Aylık Gelir-Gider Raporu</CardTitle>
                    <CardDescription>
                      Aylık bazda gelir ve gider analizi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Yakında</Badge>
                  </CardContent>
                </Card>

                <Card className="text-left">
                  <CardHeader>
                    <CardTitle>Proje Karlılık Analizi</CardTitle>
                    <CardDescription>
                      Proje bazlı kar-zarar analizi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Yakında</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
