import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import SheetView from "@/pages/sheet-view";
import { FinancialPage } from "@/pages/financial";
import ProjectsPage from "@/pages/projects";
import DocumentSearchPage from "@/pages/document-search";
import Login from "@/pages/login";
import Sidebar from "@/components/sidebar";
import LoadingOverlay from "@/components/loading-overlay";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/financial" component={FinancialPage} />
      <Route path="/document-search" component={DocumentSearchPage} />
      <Route path="/sheets/:id" component={SheetView} />
      <Route component={Dashboard} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between px-6 bg-card border-b border-border">
          <div className="flex items-center">
            {isMobile && (
              <button 
                className="mr-4 p-2 rounded-md hover:bg-accent"
                onClick={() => setSidebarOpen(true)}
                data-testid="button-toggle-sidebar"
              >
                <i className="fas fa-bars h-5 w-5"></i>
              </button>
            )}
            <h2 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
              Görkem İnşaat
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <i className="fas fa-sync-alt h-4 w-4"></i>
              <span data-testid="text-last-sync">Son senkronizasyon: {new Date().toLocaleTimeString('tr-TR')}</span>
            </div>
            
            {user && (
              <div className="flex items-center space-x-2">
                <img 
                  src={user.picture || ''} 
                  alt={user.name || ''} 
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="img-user-avatar"
                />
                <span className="text-sm text-foreground" data-testid="text-user-name">
                  {user.name}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  Çıkış
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-background">
          <Router />
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <Login />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <LoadingOverlay />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
