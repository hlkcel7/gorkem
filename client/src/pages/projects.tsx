import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
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
  TrendingUp,
  Plus
} from 'lucide-react';
import { googleSheetsClient } from '../services/googleSheets';

// Proje veri yapısı - Google Sheets'teki tüm kolonlara göre
interface ProjectData {
  proje_adi: string;                    // A: "Proje Adı"
  proje_kodu: string;                   // B: "Proje Kodu"
  proje_turu: string;                   // C: "Proje Türü"
  lokasyon: string;                     // D: "Lokasyon"
  isveren: string;                      // E: "İşveren"
  yuklenici: string;                    // F: "Yüklenici"
  musavir: string;                      // G: "Müşavir"
  sozlesme_bedeli: string;              // H: "Sözleşme Bedeli"
  avans_miktari: string;                // I: "Avans Miktarı"
  alinan_hakedisler: string;            // J: "Alınan Hakedişler Toplamı"
  yapilan_harcamalar: string;           // K: "Yapılan Harcamalar Toplamı"
  cari_durum: string;                   // L: "Cari Durum"
  gecici_teminat: string;               // M: "Geçici Teminat"
  kesin_teminat: string;                // N: "Kesin Teminat"
  finansman_kaynagi: string;            // O: "Finansman Kaynağı"
  arsa_alani: string;                   // P: "Arsa Alanı"
  toplam_insaat_alani: string;          // Q: "Toplam İnşaat Alanı"
  sozlesmeye_gore_baslangic: string;    // R: "Sözleşmeye Göre Proje başlangıç tarihi"
  sozlesmeye_gore_bitis: string;        // S: "Sözleşmeye Göre Proje Bitiş tarihi"
  isin_suresi: string;                  // T: "İşin Süresi (Gün)"
  sure_uzatimi: string;                 // U: "Süre Uzatımı"
  devam_durumu: string;                 // V: "Devam Durumu"
  fiili_bitis_tarihi: string;           // W: "Fiili Bitiş Tarihi"
  gecici_kabul_durumu: string;          // X: "Geçici Kabul Durumu"
  kesin_kabul_durumu: string;           // Y: "Kesin Kabul Durumu"
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Proje verilerini Google Sheets'ten çek
  // Google Sheets kolon eşleme fonksiyonu
  const createColumnMapping = (headers: string[]) => {
    const mapping: { [key: string]: number } = {};
    
    // Header normalleştirme - Türkçe karakterler ve boşluklar
    const normalizeHeader = (header: string) => {
      return header
        .replace(/İ/g, 'i').replace(/I/g, 'i')  // Önce büyük harfleri değiştir
        .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
        .replace(/Ö/g, 'o').replace(/Ç/g, 'c')
        .toLowerCase()  // Sonra toLowerCase
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, ' ').trim();
    };

    headers.forEach((header, index) => {
      const normalized = normalizeHeader(header);
      
      // Mapping'i oluştur
      if (normalized.includes('proje adi') || normalized === 'proje adı') {
        mapping['proje_adi'] = index;
      } else if (normalized.includes('proje kodu')) {
        mapping['proje_kodu'] = index;
      } else if (normalized.includes('proje turu') || normalized.includes('proje türü')) {
        mapping['proje_turu'] = index;
      } else if (normalized.includes('lokasyon')) {
        mapping['lokasyon'] = index;
      } else if (normalized.includes('isveren') || normalized.includes('işveren')) {
        mapping['isveren'] = index;
      } else if (normalized.includes('yuklenici') || normalized.includes('yüklenici')) {
        mapping['yuklenici'] = index;
      } else if (normalized.includes('musavir') || normalized.includes('müşavir')) {
        mapping['musavir'] = index;
      } else if (normalized.includes('sozlesme bedeli') || normalized.includes('sözleşme bedeli')) {
        mapping['sozlesme_bedeli'] = index;
      } else if (normalized.includes('avans') && normalized.includes('miktar')) {
        mapping['avans_miktari'] = index;
      } else if (normalized.includes('alinan') && normalized.includes('hakedis')) {
        mapping['alinan_hakedisler'] = index;
      } else if (normalized.includes('yapilan') && normalized.includes('harcama')) {
        mapping['yapilan_harcamalar'] = index;
      } else if (normalized.includes('cari durum')) {
        mapping['cari_durum'] = index;
      } else if (normalized.includes('gecici teminat')) {
        mapping['gecici_teminat'] = index;
      } else if (normalized.includes('kesin teminat')) {
        mapping['kesin_teminat'] = index;
      } else if (normalized.includes('finansman kaynak')) {
        mapping['finansman_kaynagi'] = index;
      } else if (normalized.includes('arsa alan')) {
        mapping['arsa_alani'] = index;
      } else if (normalized.includes('toplam insaat alan')) {
        mapping['toplam_insaat_alani'] = index;
      } else if (normalized.includes('isin suresi') || normalized.includes('işin süresi')) {
        mapping['isin_suresi'] = index;
      } else if (normalized.includes('baslangic') && normalized.includes('tarih')) {
        mapping['sozlesmeye_gore_baslangic'] = index;
      } else if (normalized.includes('bitis') && normalized.includes('tarih') && !normalized.includes('fiili')) {
        mapping['sozlesmeye_gore_bitis'] = index;
      } else if (normalized.includes('sure uzat') || normalized.includes('süre uzat')) {
        mapping['sure_uzatimi'] = index;
      } else if (normalized.includes('devam durum')) {
        mapping['devam_durumu'] = index;
      } else if (normalized.includes('fiili') && normalized.includes('bitis')) {
        mapping['fiili_bitis_tarihi'] = index;
      } else if (normalized.includes('gecici kabul')) {
        mapping['gecici_kabul_durumu'] = index;
      } else if (normalized.includes('kesin kabul')) {
        mapping['kesin_kabul_durumu'] = index;
      }
    });

    return mapping;
  };

  const loadProjectData = async () => {
    try {
      setLoading(true);
      console.log('🏗️ Projeler Dashboard: Google Sheets\'ten proje verileri çekiliyor...');

      // "Projeler" sheet'ini ara
      const spreadsheetInfo = await googleSheetsClient.getSpreadsheetInfo(
        window.__APP_CONFIG__.GOOGLE_SPREADSHEET_ID
      );

      const projectSheet = spreadsheetInfo.sheets.find(sheet => 
        sheet.title.toLowerCase().includes('proje') || 
        sheet.title.toLowerCase() === 'projeler'
      );

      if (!projectSheet) {
        console.warn('⚠️ "Projeler" sheet\'i bulunamadı');
        setProjects([]);
        return;
      }

      console.log(`📋 "${projectSheet.title}" sheet\'i bulundu`);

      const sheetData = await googleSheetsClient.getSheetData(
        window.__APP_CONFIG__.GOOGLE_SPREADSHEET_ID,
        projectSheet.title
      );

      if (!sheetData || sheetData.length <= 1) {
        console.log('📋 Projeler sheet\'inde veri yok');
        setProjects([]);
        return;
      }

      console.log(`📊 Sheets\'ten ${sheetData.length - 1} satır veri geldi`);

      // Headers'ı kontrol et ve mapping oluştur
      const headers = sheetData[0];
      console.log('📋 Sheet Headers:', headers);
      
      const columnMapping = createColumnMapping(headers);
      console.log('🗺️ Column Mapping:', columnMapping);

      // Veriyi parse et - Dinamik mapping kullanarak
      const projectsData: ProjectData[] = [];

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length === 0 || !row[columnMapping['proje_adi'] || 0]) continue; // Boş satırları geç

        const getCell = (fieldName: string, fallback: string = '') => {
          const index = columnMapping[fieldName];
          return (index !== undefined && row[index]) ? String(row[index]).trim() : fallback;
        };

        const project: ProjectData = {
          proje_adi: getCell('proje_adi', 'İsimsiz Proje'),
          proje_kodu: getCell('proje_kodu', `PROJE-${i}`),
          proje_turu: getCell('proje_turu', 'Belirtilmemiş'),
          lokasyon: getCell('lokasyon', 'Belirtilmemiş'),
          isveren: getCell('isveren', 'Belirtilmemiş'),
          yuklenici: getCell('yuklenici', 'Belirtilmemiş'),
          musavir: getCell('musavir', ''),
          sozlesme_bedeli: getCell('sozlesme_bedeli', ''),
          avans_miktari: getCell('avans_miktari', ''),
          alinan_hakedisler: getCell('alinan_hakedisler', ''),
          yapilan_harcamalar: getCell('yapilan_harcamalar', ''),
          cari_durum: getCell('cari_durum', ''),
          gecici_teminat: getCell('gecici_teminat', ''),
          kesin_teminat: getCell('kesin_teminat', ''),
          finansman_kaynagi: getCell('finansman_kaynagi', ''),
          arsa_alani: getCell('arsa_alani', ''),
          toplam_insaat_alani: getCell('toplam_insaat_alani', ''),
          sozlesmeye_gore_baslangic: getCell('sozlesmeye_gore_baslangic', ''),
          sozlesmeye_gore_bitis: getCell('sozlesmeye_gore_bitis', ''),
          isin_suresi: getCell('isin_suresi', ''),
          sure_uzatimi: getCell('sure_uzatimi', ''),
          devam_durumu: getCell('devam_durumu', 'Belirtilmemiş'),
          fiili_bitis_tarihi: getCell('fiili_bitis_tarihi', ''),
          gecici_kabul_durumu: getCell('gecici_kabul_durumu', 'Belirtilmemiş'),
          kesin_kabul_durumu: getCell('kesin_kabul_durumu', 'Belirtilmemiş')
        };

        projectsData.push(project);
      }

      console.log(`🏗️ ${projectsData.length} proje parse edildi:`, projectsData.map(p => p.proje_kodu));
      setProjects(projectsData);
      
      // İlk projeyi aktif yap
      if (projectsData.length > 0) {
        setActiveProject(projectsData[0].proje_kodu);
      }
      
      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Proje verileri yüklenemedi:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, []);

  // Proje durumuna göre renk
  const getStatusColor = (status: string): string => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('tamamland') || statusLower.includes('bitti')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('devam') || statusLower.includes('aktif')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('başla') || statusLower.includes('yeni')) return 'bg-yellow-100 text-yellow-800';
    if (statusLower.includes('durdur') || statusLower.includes('bekle')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Progress hesaplama (Alınan Hakedişler / Sözleşme Bedeli)
  const calculateProgress = (project: ProjectData): number => {
    try {
      // Sözleşme bedelinden sayısal değeri çıkar
      const sozlesmeBedeliStr = project.sozlesme_bedeli?.replace(/[^0-9.-]/g, '') || '0';
      const sozlesmeBedeli = parseFloat(sozlesmeBedeliStr);
      
      // Alınan hakedişlerden sayısal değeri çıkar
      const alinanHakedislerStr = project.alinan_hakedisler?.replace(/[^0-9.-]/g, '') || '0';
      const alinanHakedisler = parseFloat(alinanHakedislerStr);
      
      // Sözleşme bedeli yoksa veya sıfırsa progress hesaplanamaz
      if (!sozlesmeBedeli || sozlesmeBedeli <= 0) {
        return 0;
      }
      
      // Progress yüzdesi hesapla (maksimum %100)
      const progressPercent = Math.min((alinanHakedisler / sozlesmeBedeli) * 100, 100);
      
      // Negatif değerleri sıfırla sınırla
      return Math.max(progressPercent, 0);
      
    } catch (error) {
      console.warn('Progress hesaplama hatası:', error);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-600">Projeler yükleniyor...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (projects?.length === 0 || !projects) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center p-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Henüz Proje Bulunamadı
            </h3>
            <p className="text-gray-500 mb-4">
              Google Sheets'te "Projeler" tablosunu oluşturun ve proje bilgilerinizi ekleyin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Kontrol Butonları */}
      <div className="flex justify-end mb-6">
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
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeProject || projects?.[0]?.proje_kodu} onValueChange={setActiveProject}>
            <TabsList className="grid w-full overflow-x-auto mb-6" 
                      style={{ gridTemplateColumns: `repeat(${Math.min(projects?.length || 0, 4)}, 1fr)` }}>
              {projects?.slice(0, 4).map((project) => (
                <TabsTrigger key={project.proje_kodu} value={project.proje_kodu} 
                  className="text-xs font-medium data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 hover:bg-orange-50">
                  {project.proje_kodu}
                </TabsTrigger>
              ))}
              {(projects?.length || 0) > 4 && (
                <TabsTrigger value="more" 
  className="text-xs data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 hover:bg-orange-50">
  +{(projects?.length || 0) - 4} Daha
</TabsTrigger>
              )}
            </TabsList>

            {projects?.map((project) => (
              <TabsContent key={project.proje_kodu} value={project.proje_kodu} className="space-y-6">
                
                {/* Proje Özet Kartı */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Ana Bilgiler */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl mb-2">{project.proje_adi}</CardTitle>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-blue-600">
                              {project.proje_kodu}
                            </Badge>
                            <Badge className={getStatusColor(project.devam_durumu)}>
                              {project.devam_durumu || 'Durum Belirsiz'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">Finansal İlerleme</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(calculateProgress(project))}%
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Temel Bilgiler Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Temel Bilgiler
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-gray-600">Proje Türü:</span>
                              <p className="font-medium">{project.proje_turu}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">İşveren:</span>
                              <p className="font-medium">{project.isveren}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Yüklenici:</span>
                              <p className="font-medium">{project.yuklenici}</p>
                            </div>
                            {project.musavir && (
                              <div>
                                <span className="text-gray-600">Müşavir:</span>
                                <p className="font-medium">{project.musavir}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Lokasyon & Alan
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-gray-600">Lokasyon:</span>
                              <p className="font-medium">{project.lokasyon}</p>
                            </div>
                            {project.arsa_alani && (
                              <div>
                                <span className="text-gray-600">Arsa Alanı:</span>
                                <p className="font-medium">{project.arsa_alani}</p>
                              </div>
                            )}
                            {project.toplam_insaat_alani && (
                              <div>
                                <span className="text-gray-600">İnşaat Alanı:</span>
                                <p className="font-medium">{project.toplam_insaat_alani}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Zaman Çizelgesi */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Zaman Çizelgesi
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {project.sozlesmeye_gore_baslangic && (
                            <div>
                              <span className="text-gray-600">Sözleşme Başlangıç:</span>
                              <p className="font-medium">{project.sozlesmeye_gore_baslangic}</p>
                            </div>
                          )}
                          {project.sozlesmeye_gore_bitis && (
                            <div>
                              <span className="text-gray-600">Sözleşme Bitiş:</span>
                              <p className="font-medium">{project.sozlesmeye_gore_bitis}</p>
                            </div>
                          )}
                          {project.fiili_bitis_tarihi && (
                            <div>
                              <span className="text-gray-600">Fiili Bitiş:</span>
                              <p className="font-medium">{project.fiili_bitis_tarihi}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Finansal İlerleme Durumu</span>
                          <span className="font-medium">{Math.round(calculateProgress(project))}%</span>
                        </div>
                        <Progress value={calculateProgress(project)} className="h-3" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Başlangıç (0%)</span>
                          <span>Hakediş/Bedel Oranı</span>
                          <span>Tamamlandı (100%)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Durum Kartı */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Proje Durumu
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">Geçici Kabul:</span>
                          <Badge variant={project.gecici_kabul_durumu?.toLowerCase().includes('tamam') ? 'default' : 'secondary'}>
                            {project.gecici_kabul_durumu || 'Belirtilmemiş'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">Kesin Kabul:</span>
                          <Badge variant={project.kesin_kabul_durumu?.toLowerCase().includes('tamam') ? 'default' : 'secondary'}>
                            {project.kesin_kabul_durumu || 'Belirtilmemiş'}
                          </Badge>
                        </div>

                        {project.gecici_teminat && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium">Geçici Teminat:</span>
                            <span className="text-sm font-bold text-blue-600">{project.gecici_teminat}</span>
                          </div>
                        )}

                        {project.kesin_teminat && (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium">Kesin Teminat:</span>
                            <span className="text-sm font-bold text-green-600">{project.kesin_teminat}</span>
                          </div>
                        )}

                        {project.sozlesme_bedeli && (
                          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium">Sözleşme Bedeli:</span>
                            <span className="text-sm font-bold text-purple-600">{project.sozlesme_bedeli}</span>
                          </div>
                        )}

                        {project.avans_miktari && (
                          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                            <span className="text-sm font-medium">Avans Miktarı:</span>
                            <span className="text-sm font-bold text-indigo-600">{project.avans_miktari}</span>
                          </div>
                        )}

                        {project.alinan_hakedisler && (
                          <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                            <span className="text-sm font-medium">Alınan Hakedişler:</span>
                            <span className="text-sm font-bold text-teal-600">{project.alinan_hakedisler}</span>
                          </div>
                        )}

                        {project.yapilan_harcamalar && (
                          <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                            <span className="text-sm font-medium">Yapılan Harcamalar:</span>
                            <span className="text-sm font-bold text-rose-600">{project.yapilan_harcamalar}</span>
                          </div>
                        )}

                        {project.cari_durum && (
                          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                            <span className="text-sm font-medium">Cari Durum:</span>
                            <span className={`text-sm font-bold ${
                              parseFloat(project.cari_durum) > 0 
                                ? 'text-emerald-600' 
                                : parseFloat(project.cari_durum) < 0 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                            }`}>
                              {project.cari_durum}
                            </span>
                          </div>
                        )}

                        {project.sure_uzatimi && (
                          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <span className="text-sm font-medium">Süre Uzatımı:</span>
                            <span className="text-sm font-bold text-orange-600">{project.sure_uzatimi}</span>
                          </div>
                        )}
                      </div>

                      {project.finansman_kaynagi && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                          <h5 className="text-sm font-medium text-yellow-800 mb-2">Finansman Kaynağı:</h5>
                          <p className="text-sm text-yellow-700">{project.finansman_kaynagi}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
