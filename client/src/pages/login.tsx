import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { googleSheetsClient } from "@/services/googleSheets";
import { useLocation } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!auth) {
      setError('Firebase auth yapılandırılmamış. Lütfen yöneticinize başvurun.');
      setLoading(false);
      return;
    }

    try {
      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      try {
        // Google Sheets servisine login
        console.log("Firebase kimlik doğrulama başarılı, Google Sheets kimlik doğrulama başlatılıyor...");
        await googleSheetsClient.signIn();
        console.log("Google Sheets kimlik doğrulama başarılı!");
      } catch (sheetsErr: any) {
        console.error("Google Sheets kimlik doğrulama hatası:", sheetsErr);
        // Google Sheets kimlik doğrulama hatası durumunda ana sayfaya yönlendir
        // Kullanıcı sonradan Google ile giriş yapabilir
        setLocation('/');
        return;
      }
      
      // Ana sayfaya yönlendir (wouter ile soft redirect)
      setLocation('/');
    } catch (err: any) {
      console.error("Firebase kimlik doğrulama hatası:", err);
      setError(err.message || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-[420px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Görkem İnşaat</CardTitle>
          <CardDescription>Proje Takip ve Muhasebe Sistemi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              E-posta ve şifrenizle giriş yapın
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              {error && <div className="text-sm text-red-500">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Giriş yapılıyor..." : "E-posta ile Giriş"}
              </Button>
            </form>
            
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 my-2">veya</p>
              <Button 
                type="button" 
                className="w-full" 
                variant="outline"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    console.log("Google Sheets kimlik doğrulama başlatılıyor...");
                    await googleSheetsClient.signIn();
                    console.log("Google Sheets kimlik doğrulama başarılı!");
                    setLocation('/');
                  } catch (err: any) {
                    console.error("Google kimlik doğrulama hatası:", err);
                    setError("Google erişimi başarısız: " + (err.message || err));
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Google ile Giriş Yap
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}