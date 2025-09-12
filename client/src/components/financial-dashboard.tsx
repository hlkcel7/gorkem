import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  Building2,
  BarChart3 
} from 'lucide-react';
import { googleSheetsClient } from '@/services/googleSheets';

interface FinancialKPI {
  toplam_gelir: number;
  toplam_gider: number;
  net_kar: number;
  nakit_pozisyon: number;
  aktif_projeler: number;
  yaklasan_odemeler: number;
}

interface FinancialDashboardProps {
  selectedMonth?: string;
  selectedYear?: string;
}

export function FinancialDashboard({ 
  selectedMonth = String(new Date().getMonth() + 1), 
  selectedYear = String(new Date().getFullYear()) 
}: FinancialDashboardProps) {
  const [kpiData, setKpiData] = useState<FinancialKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // KPI verilerini Google Sheets'ten çek - Sadece mevcut tablolardan
  const loadFinancialKPIs = async () => {
    try {
      setLoading(true);
      console.log('📊 Financial Dashboard: Mevcut tablolardan KPI hesaplama...');
      // If client-side Google Sheets is not available/authenticated, show demo values
      if (!googleSheetsClient || typeof googleSheetsClient.isAuthenticated !== 'function' || !googleSheetsClient.isAuthenticated()) {
        console.warn('Client-side Google Sheets not available or not authenticated. Showing demo KPI values.');
        setKpiData({
          toplam_gelir: 0,
          toplam_gider: 0,
          net_kar: 0,
          nakit_pozisyon: 0,
          aktif_projeler: 0,
          yaklasan_odemeler: 0
        });
        setLastUpdated(new Date());
        return;
      }
      
      let toplamGelir = 0;
      let toplamGider = 0;
      let nakitPozisyon = 0;
      let yakasanOdemelerSayisi = 0;

      // Mevcut spreadsheet'teki tüm sheet'leri kontrol et
      // Cast to any because client-side googleSheets stub has flexible structure
      const spreadsheetInfo: any = await googleSheetsClient.getSpreadsheetInfo(
        window.__APP_CONFIG__.GOOGLE_SPREADSHEET_ID
      );

      if (!spreadsheetInfo.sheets || spreadsheetInfo.sheets.length === 0) {
        console.warn('⚠️ Hiç tablo bulunamadı');
        throw new Error('No sheets found');
      }

  console.log(`📋 ${spreadsheetInfo.sheets.length} tablo bulundu:`, spreadsheetInfo.sheets.map((s: any) => s.title));

      // Her sheet'i kontrol et ve finansal verileri topla
      for (const sheet of spreadsheetInfo.sheets) {
        try {
          const sheetTitle = sheet.title.toLowerCase();
          let sheetCategory = 'other';

          // Sheet kategorisini belirle
          if (/(gelir|income|revenue|satış|sales)/i.test(sheetTitle)) {
            sheetCategory = 'income';
          } else if (/(gider|expense|cost|harcama|masraf)/i.test(sheetTitle)) {
            sheetCategory = 'expense';
          } else if (/(nakit|cash|banka|bank|kasa|hesap)/i.test(sheetTitle)) {
            sheetCategory = 'cash';
          } else if (/(ödeme|payment|tahsilat|borç|debt)/i.test(sheetTitle)) {
            sheetCategory = 'payment';
          }

          if (sheetCategory === 'other') {
            console.log(`⏭️ "${sheet.title}" tablosu finansal olmayan tablo`);
            continue;
          }

          console.log(`🔍 "${sheet.title}" tablosu analiz ediliyor (${sheetCategory})`);

          const sheetData = await googleSheetsClient.getSheetData(
            window.__APP_CONFIG__.GOOGLE_SPREADSHEET_ID,
            sheet.title
          );

          if (!sheetData || sheetData.length <= 1) {
            console.log(`📋 "${sheet.title}" tablosunda veri yok`);
            continue;
          }

          console.log(`📊 "${sheet.title}": ${sheetData.length - 1} satır veri`);

          // Finansal hesaplama yap
          switch (sheetCategory) {
            case 'income':
              const gelirTotal = calculateFinancialTotal(sheetData, ['tutar', 'amount', 'miktar', 'gelir']);
              toplamGelir += gelirTotal;
              console.log(`💰 ${sheet.title}: +${gelirTotal.toLocaleString('tr-TR')} ₺`);
              break;
            
            case 'expense':
              const giderTotal = calculateFinancialTotal(sheetData, ['tutar', 'amount', 'miktar', 'gider']);
              toplamGider += giderTotal;
              console.log(`📊 ${sheet.title}: -${giderTotal.toLocaleString('tr-TR')} ₺`);
              break;
            
            case 'cash':
              const nakitTotal = calculateFinancialTotal(sheetData, ['bakiye', 'balance', 'tutar', 'nakit']);
              nakitPozisyon += nakitTotal;
              console.log(`🏦 ${sheet.title}: ${nakitTotal.toLocaleString('tr-TR')} ₺`);
              break;
            
            case 'payment':
              const upcomingCount = sheetData.length - 1; // Header hariç satır sayısı
              yakasanOdemelerSayisi += upcomingCount;
              console.log(`⏰ ${sheet.title}: ${upcomingCount} yaklaşan ödeme`);
              break;
          }

        } catch (error) {
          console.warn(`⚠️ "${sheet.title}" tablosu işlenirken hata:`, error);
          continue;
        }
      }

      // KPI sonuçlarını hazırla
      const kpis: FinancialKPI = {
        toplam_gelir: toplamGelir,
        toplam_gider: toplamGider,
        net_kar: toplamGelir - toplamGider,
        nakit_pozisyon: nakitPozisyon,
        aktif_projeler: Math.max(1, spreadsheetInfo.sheets.filter((s: any) => 
          /(proje|project|iş)/i.test(s.title.toLowerCase())
        ).length),
        yaklasan_odemeler: yakasanOdemelerSayisi
      };

      console.log('📈 Final KPI Results:', {
        'Toplam Gelir': `${kpis.toplam_gelir.toLocaleString('tr-TR')} ₺`,
        'Toplam Gider': `${kpis.toplam_gider.toLocaleString('tr-TR')} ₺`,
        'Net Kar': `${kpis.net_kar.toLocaleString('tr-TR')} ₺`,
        'Nakit': `${kpis.nakit_pozisyon.toLocaleString('tr-TR')} ₺`,
        'Projeler': kpis.aktif_projeler,
        'Ödemeler': kpis.yaklasan_odemeler
      });

      setKpiData(kpis);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Financial KPI loading failed:', error);
      
      // Hata durumunda demo KPI'lar göster
      setKpiData({
        toplam_gelir: 0,
        toplam_gider: 0,
        net_kar: 0,
        nakit_pozisyon: 0,
        aktif_projeler: 0,
        yaklasan_odemeler: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Finansal toplam hesaplama - flexible column matching
  const calculateFinancialTotal = (data: any[][], targetColumns: string[]): number => {
    if (!data || data.length <= 1) return 0;
    
    const headers = data[0]?.map((h: string) => h?.toLowerCase()) || [];
    
    // Hedef kolonlardan birini bul
    let columnIndex = -1;
    for (const target of targetColumns) {
      columnIndex = headers.findIndex(h => h?.includes(target.toLowerCase()));
      if (columnIndex >= 0) break;
    }
    
    if (columnIndex < 0) return 0;
    
    return data.slice(1).reduce((total, row) => {
      const value = parseFloat(row[columnIndex]?.toString().replace(/[^0-9.-]/g, '') || '0');
      return total + (isNaN(value) ? 0 : value);
    }, 0);
  };

  // Para formatı
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Component mount'ta veri yükle
  useEffect(() => {
    loadFinancialKPIs();
    
    // Her 2 dakikada bir otomatik yenile
    const interval = setInterval(loadFinancialKPIs, 120000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const profitMargin = kpiData?.toplam_gelir ? (kpiData.net_kar / kpiData.toplam_gelir) * 100 : 0;
  const expenseRatio = kpiData?.toplam_gelir ? (kpiData.toplam_gider / kpiData.toplam_gelir) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Finansal Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedMonth}/{selectedYear} dönem özeti
            {lastUpdated && (
              <span className="ml-4 text-xs">
                Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
              </span>
            )}
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={loadFinancialKPIs} variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Ana KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Gelir */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(kpiData?.toplam_gelir || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Bu ay
            </p>
          </CardContent>
        </Card>

        {/* Toplam Gider */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(kpiData?.toplam_gider || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gider oranı: %{expenseRatio.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        {/* Net Kar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Kar</CardTitle>
            <DollarSign className={`h-4 w-4 ${(kpiData?.net_kar || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(kpiData?.net_kar || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(kpiData?.net_kar || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Kar marjı: %{profitMargin.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        {/* Nakit Pozisyon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nakit Pozisyon</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(kpiData?.nakit_pozisyon || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tüm hesaplar toplamı
            </p>
          </CardContent>
        </Card>

        {/* Aktif Projeler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Projeler</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {kpiData?.aktif_projeler || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Devam eden projeler
            </p>
          </CardContent>
        </Card>

        {/* Yaklaşan Ödemeler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan Ödemeler</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {kpiData?.yaklasan_odemeler || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Bu hafta içinde
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performans Göstergeleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Kar Marjı Analizi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Kar Marjı</span>
                <span>%{profitMargin.toFixed(1)}</span>
              </div>
              <Progress value={Math.max(0, profitMargin)} className="h-2" />
            </div>
            <div className="text-xs text-muted-foreground">
              {profitMargin >= 20 ? (
                <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
              ) : profitMargin >= 10 ? (
                <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>
              ) : (
                <Badge variant="destructive">Needs Improvement</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gider Kontrolü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Gider Oranı</span>
                <span>%{expenseRatio.toFixed(1)}</span>
              </div>
              <Progress value={expenseRatio} className="h-2" />
            </div>
            <div className="text-xs text-muted-foreground">
              {expenseRatio <= 60 ? (
                <Badge variant="default" className="bg-green-100 text-green-800">Kontrollü</Badge>
              ) : expenseRatio <= 80 ? (
                <Badge variant="default" className="bg-yellow-100 text-yellow-800">Dikkat</Badge>
              ) : (
                <Badge variant="destructive">Yüksek Risk</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
