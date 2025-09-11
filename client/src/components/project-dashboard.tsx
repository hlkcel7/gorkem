import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileText,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { googleSheetsClient } from '../services/googleSheets';

// Proje veri yapısı
interface ProjectData {
  proje_adi: string;
  proje_kodu: string;
  isveren: string;
  yuklenici_firma: string;
  musavir_firma?: string;
  proje_turu: string;
  lokasyon: string;
  arsa_alani: number;
  insaat_alani_brut: number;
  insaat_alani_net: number;
  kat_adedi: number;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  devam_durumu: string;
  fiili_bitis_tarihi?: string;
  alt_yukleniciler?: string;
  yaklasik_maliyet: number;
  kesin_teminat_yuzde: number;
  gecici_teminat_yuzde: number;
  finansman_kaynaklari: string;
  gecici_kabul_durumu: string;
  kesin_kabul_durumu: string;
  as_built_durumu: string;
}

interface ProjectDashboardProps {
  className?: string;
}

export function ProjectDashboard({ className }: ProjectDashboardProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Proje verilerini Google Sheets'ten çek
  const loadProjectData = async () => {
    try {
      setLoading(true);
      console.log('🏗️ Project Dashboard: Proje verilerini yüklüyor...');

      // Projeler tablosunu ara
      const spreadsheetInfo = await googleSheetsClient.getSpreadsheetInfo(
        window.__APP_CONFIG__.GOOGLE_SPREADSHEET_ID
      );

      const projectSheet = spreadsheetInfo.sheets.find(sheet => 
        /(proje|project)/i.test(sheet.title.toLowerCase())
      );

      if (!projectSheet) {
        console.warn('⚠️ Projeler tablosu bulunamadı');
        setProjects([]);
        return;
      }

      console.log(`📋 "${projectSheet.title}" tablosu bulundu`);

      const sheetData = await googleSheetsClient.getSheetData(
        window.__APP_CONFIG__.GOOGLE_SPREADSHEET_ID,
        projectSheet.title
      );

      if (!sheetData || sheetData.length <= 1) {
        console.log('📋 Projeler tablosunda veri yok');
        setProjects([]);
        return;
      }

      // Veriyi parse et
      const headers = sheetData[0].map((h: string) => h?.toLowerCase().trim());
      const projectsData: ProjectData[] = [];

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length === 0) continue;

        const project: any = {};
        
        // Kolonları map et
        headers.forEach((header, index) => {
          const value = row[index] || '';
          
          if (header.includes('proje adı') || header.includes('proje adi')) {
            project.proje_adi = value;
          } else if (header.includes('proje numarası') || header.includes('kodu')) {
            project.proje_kodu = value;
          } else if (header.includes('işveren') || header.includes('isveren')) {
            project.isveren = value;
          } else if (header.includes('yüklenici') || header.includes('yuklenici')) {
            project.yuklenici_firma = value;
          } else if (header.includes('müşavir') || header.includes('musavir')) {
            project.musavir_firma = value;
          } else if (header.includes('proje türü') || header.includes('turu')) {
            project.proje_turu = value;
          } else if (header.includes('lokasyon') || header.includes('adres')) {
            project.lokasyon = value;
          } else if (header.includes('arsa alanı')) {
            project.arsa_alani = parseFloat(value.toString().replace(/[^0-9.]/g, '') || '0');
          } else if (header.includes('brüt') && header.includes('inşaat')) {
            project.insaat_alani_brut = parseFloat(value.toString().replace(/[^0-9.]/g, '') || '0');
          } else if (header.includes('net') && header.includes('inşaat')) {
            project.insaat_alani_net = parseFloat(value.toString().replace(/[^0-9.]/g, '') || '0');
          } else if (header.includes('kat adedi')) {
            project.kat_adedi = parseInt(value.toString().replace(/[^0-9]/g, '') || '0');
          } else if (header.includes('başlangıç') || header.includes('baslangic')) {
            project.baslangic_tarihi = value;
          } else if (header.includes('bitiş') || header.includes('bitis')) {
            project.bitis_tarihi = value;
          } else if (header.includes('devam durumu')) {
            project.devam_durumu = value;
          } else if (header.includes('fiili bitiş')) {
            project.fiili_bitis_tarihi = value;
          } else if (header.includes('alt yüklenici')) {
            project.alt_yukleniciler = value;
          } else if (header.includes('maliyet')) {
            project.yaklasik_maliyet = parseFloat(value.toString().replace(/[^0-9.]/g, '') || '0');
          } else if (header.includes('kesin teminat')) {
            project.kesin_teminat_yuzde = parseFloat(value.toString().replace(/[^0-9.]/g, '') || '0');
          } else if (header.includes('geçici teminat')) {
            project.gecici_teminat_yuzde = parseFloat(value.toString().replace(/[^0-9.]/g, '') || '0');
          } else if (header.includes('finansman')) {
            project.finansman_kaynaklari = value;
          } else if (header.includes('geçici kabul')) {
            project.gecici_kabul_durumu = value;
          } else if (header.includes('kesin kabul')) {
            project.kesin_kabul_durumu = value;
          } else if (header.includes('as-built') || header.includes('as built')) {
            project.as_built_durumu = value;
          }
        });

        if (project.proje_adi && project.proje_kodu) {
          projectsData.push(project as ProjectData);
        }
      }

      console.log(`🏗️ ${projectsData.length} proje yüklendi:`, projectsData.map(p => p.proje_kodu));
      setProjects(projectsData);
      
      // İlk projeyi aktif yap
      if (projectsData.length > 0 && !activeProject) {
        setActiveProject(projectsData[0].proje_kodu);
      }
      
      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Project loading failed:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, []);

  // Proje durumuna göre renk belirleme
  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('tamamland') || statusLower.includes('bitti')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('devam') || statusLower.includes('aktif')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('başla') || statusLower.includes('yeni')) return 'bg-yellow-100 text-yellow-800';
    if (statusLower.includes('durdur') || statusLower.includes('bekle')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Progress hesaplama (örnek olarak)
  const calculateProgress = (project: ProjectData): number => {
    const start = new Date(project.baslangic_tarihi);
    const end = new Date(project.bitis_tarihi);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
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

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Projeler yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center p-12">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Henüz Proje Bulunamadı
          </h3>
          <p className="text-gray-500 mb-4">
            Sidebar'dan "Projeler" tablosu oluşturup proje bilgilerinizi girin.
          </p>
          <Button onClick={loadProjectData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentProject = projects.find(p => p.proje_kodu === activeProject) || projects[0];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Proje Yönetimi</h1>
          <Badge variant="secondary">{projects.length} Proje</Badge>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Son Güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
            </span>
          )}
          <Button onClick={loadProjectData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Proje Sekmeleri */}
      <Tabs value={activeProject || projects[0]?.proje_kodu} onValueChange={setActiveProject}>
        <TabsList className="grid w-full overflow-x-auto" style={{ gridTemplateColumns: `repeat(${projects.length}, minmax(150px, 1fr))` }}>
          {projects.map((project) => (
            <TabsTrigger
  key={project.proje_kodu}
  value={project.proje_kodu}
  className="text-xs data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 data-[state=active]:font-semibold"
>
  {project.proje_kodu}
</TabsTrigger>


          ))}
        </TabsList>

        {projects.map((project) => (
          <TabsContent key={project.proje_kodu} value={project.proje_kodu} className="space-y-6 mt-6">
            
            {/* Proje Özet Kartı */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{project.proje_adi}</CardTitle>
                    <CardDescription className="text-lg font-medium text-blue-600">
                      {project.proje_kodu}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.devam_durumu)}>
                    {project.devam_durumu}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Temel Bilgiler */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Temel Bilgiler
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">İşveren:</span>
                        <p className="font-medium">{project.isveren}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Yüklenici:</span>
                        <p className="font-medium">{project.yuklenici_firma}</p>
                      </div>
                      {project.musavir_firma && (
                        <div>
                          <span className="text-gray-600">Müşavir:</span>
                          <p className="font-medium">{project.musavir_firma}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Proje Türü:</span>
                        <p className="font-medium">{project.proje_turu}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lokasyon ve Büyüklük */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Lokasyon & Büyüklük
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Lokasyon:</span>
                        <p className="font-medium">{project.lokasyon}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Arsa Alanı:</span>
                        <p className="font-medium">{project.arsa_alani.toLocaleString()} m²</p>
                      </div>
                      <div>
                        <span className="text-gray-600">İnşaat Brüt:</span>
                        <p className="font-medium">{project.insaat_alani_brut.toLocaleString()} m²</p>
                      </div>
                      <div>
                        <span className="text-gray-600">İnşaat Net:</span>
                        <p className="font-medium">{project.insaat_alani_net.toLocaleString()} m²</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Kat Adedi:</span>
                        <p className="font-medium">{project.kat_adedi}</p>
                      </div>
                    </div>
                  </div>

                  {/* Finansal Bilgiler */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Finansal Bilgiler
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Yaklaşık Maliyet:</span>
                        <p className="font-medium text-green-600">{formatCurrency(project.yaklasik_maliyet)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Kesin Teminat:</span>
                        <p className="font-medium">%{project.kesin_teminat_yuzde}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Geçici Teminat:</span>
                        <p className="font-medium">%{project.gecici_teminat_yuzde}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Finansman:</span>
                        <p className="font-medium">{project.finansman_kaynaklari}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Zaman Çizelgesi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Zaman Çizelgesi
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Başlangıç:</span>
                        <p className="font-medium">{project.baslangic_tarihi}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Planlanan Bitiş:</span>
                        <p className="font-medium">{project.bitis_tarihi}</p>
                      </div>
                      {project.fiili_bitis_tarihi && (
                        <div>
                          <span className="text-gray-600">Fiili Bitiş:</span>
                          <p className="font-medium">{project.fiili_bitis_tarihi}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* İlerleme */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Proje İlerlemesi</span>
                        <span className="font-medium">{calculateProgress(project).toFixed(0)}%</span>
                      </div>
                      <Progress value={calculateProgress(project)} className="h-2" />
                    </div>
                  </div>

                  {/* Durum Bilgileri */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Durum Bilgileri
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Geçici Kabul:</span>
                        <Badge variant={project.gecici_kabul_durumu.toLowerCase().includes('tamam') ? 'default' : 'secondary'}>
                          {project.gecici_kabul_durumu}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Kesin Kabul:</span>
                        <Badge variant={project.kesin_kabul_durumu.toLowerCase().includes('tamam') ? 'default' : 'secondary'}>
                          {project.kesin_kabul_durumu}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">As-Built:</span>
                        <Badge variant={project.as_built_durumu.toLowerCase().includes('tamam') ? 'default' : 'secondary'}>
                          {project.as_built_durumu}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alt Yükleniciler */}
                {project.alt_yukleniciler && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4" />
                      Alt Yükleniciler
                    </h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{project.alt_yukleniciler}</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
