import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import CreateSheetModal from "./create-sheet-modal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSheets, useDeleteSheet } from "@/hooks/useSheets";
import { apiRequest } from "@/lib/queryClient";
import RenameSheetModal from "./rename-sheet-modal";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const { data: sheets = [], isLoading } = useSheets();
  const deleteSheetMutation = useDeleteSheet();
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    sheetId?: string;
    sheetName?: string;
  }>({ visible: false, x: 0, y: 0 });
  const [showRenameModal, setShowRenameModal] = useState(false);

  const handleNavigation = (path: string) => {
    setLocation(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleDeleteSheet = (sheetTabId: number, sheetName: string) => {
    if (confirm(`"${sheetName}" adlı sheet'i silmek istediğinizden emin misiniz?`)) {
      deleteSheetMutation.mutate({ sheetTabId }, {
        onSuccess: () => {
          toast({
            title: "Sheet Silindi",
            description: "Sheet başarıyla silindi.",
          });
        },
        onError: () => {
          toast({
            title: "Silme Hatası",
            description: "Sheet silinirken bir hata oluştu.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleRenameSheet = async (sheetId: string, currentName: string) => {
    setShowRenameModal(true);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-border">
        <div className="flex items-center">
          <i className="fas fa-building text-primary text-2xl mr-3"></i>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Görkem İnşaat</h1>
            <p className="text-sm text-muted-foreground">Proje Takip Sistemi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button
          onClick={() => handleNavigation("/projects")}
          className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            location === "/projects" 
              ? "bg-primary text-primary-foreground" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
          data-testid="nav-projects"
        >
          <i className="fas fa-building mr-3 h-5 w-5"></i>
          🏗️ Projeler Özet Tablosu
        </button>

        <button
          onClick={() => handleNavigation("/")}
          className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            location === "/" 
              ? "bg-primary text-primary-foreground" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
          data-testid="nav-dashboard"
        >
          <i className="fas fa-chart-line mr-3 h-5 w-5"></i>
          📊 Dashboard
        </button>

        <button
          onClick={() => handleNavigation("/financial")}
          className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            location === "/financial" 
              ? "bg-primary text-primary-foreground" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
          data-testid="nav-financial"
        >
          <i className="fas fa-chart-bar mr-3 h-5 w-5"></i>
          Finansal Dashboard
        </button>

        <button
          onClick={() => handleNavigation("/document-search")}
          className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            location === "/document-search" 
              ? "bg-primary text-primary-foreground" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
          data-testid="nav-document-search"
        >
          <i className="fas fa-search mr-3 h-5 w-5"></i>
          🔍 Belge Arama
        </button>
        
        {/* Google Sheets List */}
        <div className="mt-6">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Google Sheets
          </h3>
          <div className="mt-2 space-y-1">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-3 py-2 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : sheets.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Henüz sheet yok</p>
                <p className="text-xs text-muted-foreground">İlk sheet'inizi oluşturun</p>
              </div>
            ) : (
              sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location === `/sheets/${sheet.id}`
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <button
                    onClick={() => handleNavigation(`/sheets/${sheet.id}`)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, sheetId: sheet.id, sheetName: sheet.name });
                    }}
                    className="flex items-center flex-1 text-left"
                    data-testid={`nav-sheet-${sheet.id}`}
                  >
                    <i className="fas fa-table mr-3 h-4 w-4 text-muted-foreground"></i>
                    <span className="truncate">{sheet.name}</span>
                  </button>
                  <div className="ml-auto flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheet(sheet.sheetTabId, sheet.name);
                      }}
                      className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                      data-testid={`button-delete-sheet-${sheet.id}`}
                    >
                      <i className="fas fa-trash h-3 w-3"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="outline"
            className="mt-3 w-full border-dashed"
            data-testid="button-create-sheet"
          >
            <i className="fas fa-plus mr-2 h-4 w-4"></i>
            Yeni Sheet Oluştur
          </Button>
        </div>
      </nav>

      {/* Create Sheet Modal */}
      {showCreateModal && (
        <CreateSheetModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Context menu */}
          {contextMenu.visible && (
        <div
          className="fixed z-50 bg-card border border-border rounded shadow-md p-2"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu({ ...contextMenu, visible: false })}
        >
          <button
            className="block w-full text-left px-3 py-1 hover:bg-accent rounded"
            onClick={() => {
              if (contextMenu.sheetId) handleNavigation(`/sheets/${contextMenu.sheetId}`);
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            Aç
          </button>
          <button
            className="block w-full text-left px-3 py-1 hover:bg-accent rounded"
            onClick={() => {
              if (contextMenu.sheetId && contextMenu.sheetName) handleRenameSheet(contextMenu.sheetId, contextMenu.sheetName);
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            Yeniden Adlandır
          </button>
          <button
            className="block w-full text-left px-3 py-1 hover:bg-destructive rounded"
            onClick={() => {
              if (contextMenu.sheetId) {
                const s = sheets.find(s => s.id === contextMenu.sheetId);
                if (s) handleDeleteSheet(s.sheetTabId, s.name);
              }
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            Sil
          </button>
        </div>
      )}

      {/* Rename Modal */}
      <RenameSheetModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        sheetId={contextMenu.sheetId || null}
        currentName={contextMenu.sheetName || ''}
        onSuccess={() => {
          setShowRenameModal(false);
          // navigate to sheet to reflect changes
          if (contextMenu.sheetId) setLocation(`/sheets/${contextMenu.sheetId}`);
        }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Sidebar Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={onClose}
              data-testid="overlay-mobile-sidebar"
            ></div>
            <div className="fixed inset-y-0 left-0 w-80">
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="hidden md:flex md:w-80 md:flex-col">
      {sidebarContent}
    </div>
  );
}
