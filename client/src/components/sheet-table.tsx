import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUpdateRecord, useAddRecord } from "@/hooks/useSheets";
import { Plus, Save, RefreshCw } from "lucide-react";

interface SheetTableProps {
  headers: string[];
  records: any[];
  sheetName: string;
  sheetTabId: number;
  onDataChange: () => void;
}

export function SheetTable({ headers, records, sheetName, sheetTabId, onDataChange }: SheetTableProps) {
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Google Sheets benzeri: minimum 20 satır, 10 kolon göster
  const minRows = Math.max(20, records.length + 5);
  const minCols = Math.max(10, headers.length);

  // Helper function to convert column index to Excel-style letters
  const getColumnLetter = (index: number): string => {
    let result = '';
    let num = index;
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
      if (num < 0) break;
    }
    return result;
  };

  // Initialize sheet data from provided records (Google Sheets removed)
  useEffect(() => {
    const data: string[][] = [];
    for (let row = 0; row < minRows; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < minCols; col++) {
        if (row < records.length && col < headers.length) {
          const header = headers[col];
          rowData[col] = records[row]?.[header] || '';
        } else {
          rowData[col] = '';
        }
      }
      data[row] = rowData;
    }
    setSheetData(data);
  }, [records, headers, minRows, minCols]);

  // Auto-refresh removed (Google Sheets sync deprecated)

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell(null);
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
  };

  const handleCellUpdate = async (row: number, col: number, newValue: string) => {
    // This method is now mainly for logging/notifications since we update in real-time
    toast({
      title: "Hücre güncellendi",
      description: `${getColumnLetter(col)}${row + 1} = "${newValue}"`,
    });
  };

  const refreshFromGoogleSheets = async () => {
    toast({ title: 'Devre Dışı', description: 'Google Sheets senkronizasyonu client tarafında kaldırıldı.', variant: 'destructive' });
  };

  const saveToGoogleSheets = async () => {
    // Saving to Google Sheets is deprecated in client. Consider server-side migration.
    console.warn('Save to Google Sheets attempted from client; operation skipped.');
    toast({ title: 'Devre Dışı', description: 'Google Sheets kaydetme client tarafında devre dışı bırakıldı.', variant: 'destructive' });
    setHasUnsavedChanges(false);
    onDataChange();
  };

  const handleKeyPress = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setEditingCell(null);
      
      // Auto-save to Google Sheets when Enter is pressed
      saveToGoogleSheets();
      
      // Move to next row
      if (row < minRows - 1) {
        setSelectedCell({ row: row + 1, col });
        setEditingCell({ row: row + 1, col });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setEditingCell(null);
      
      // Auto-save to Google Sheets when Tab is pressed
      saveToGoogleSheets();
      
      // Move to next column
      if (col < minCols - 1) {
        setSelectedCell({ row, col: col + 1 });
        setEditingCell({ row, col: col + 1 });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell || editingCell) return;
    
    const { row, col } = selectedCell;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        newRow = Math.min(minRows - 1, row + 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        newCol = Math.min(minCols - 1, col + 1);
        e.preventDefault();
        break;
      case 'Enter':
        setEditingCell({ row, col });
        e.preventDefault();
        return;
      case 'Delete':
      case 'Backspace':
        // Clear cell content
        const newSheetData = [...sheetData];
        if (!newSheetData[row]) newSheetData[row] = [];
        newSheetData[row][col] = '';
        setSheetData(newSheetData);
        setHasUnsavedChanges(true);
        e.preventDefault();
        return;
      default:
        // Start editing with typed character
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          setEditingCell({ row, col });
          // Clear cell and let the input handle the character
          const newSheetData = [...sheetData];
          if (!newSheetData[row]) newSheetData[row] = [];
          newSheetData[row][col] = '';
          setSheetData(newSheetData);
          setHasUnsavedChanges(true);
          return;
        }
        return;
    }

    setSelectedCell({ row: newRow, col: newCol });
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  return (
    <div className="space-y-4">
      {/* Google Sheets benzeri tablo */}
      <Card className="overflow-hidden">
        <div 
          className="overflow-auto overflow-x-auto" 
          style={{ maxHeight: '70vh', minWidth: '100%' }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <table className="w-full border-collapse" style={{ minWidth: '100%' }}>
            {/* Column headers */}
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700 z-10">
              <tr>
                {/* Corner cell */}
                <th className="w-12 h-8 border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-600"></th>
                
                {Array.from({ length: minCols }, (_, colIndex) => (
                  <th 
                    key={colIndex}
                    className="min-w-[100px] h-8 border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-600 px-2 text-center text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {getColumnLetter(colIndex)}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {Array.from({ length: minRows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  {/* Row number */}
                  <td className="w-12 h-8 border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-center text-xs font-mono text-slate-600 dark:text-slate-300 sticky left-0">
                    {rowIndex + 1}
                  </td>
                  
                  {Array.from({ length: minCols }, (_, colIndex) => {
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                    const cellValue = sheetData[rowIndex]?.[colIndex] || '';
                    
                    return (
                      <td
                        key={colIndex}
                        className={`
                          relative min-w-[100px] h-8 border border-slate-300 dark:border-slate-600 p-0 cursor-cell
                          ${isSelected 
                            ? 'ring-2 ring-blue-500 ring-inset bg-blue-50 dark:bg-blue-900/20' 
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }
                        `}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          <Input
                            ref={inputRef}
                            value={cellValue}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              // Update local sheet data immediately for better UX
                              const newSheetData = [...sheetData];
                              if (!newSheetData[rowIndex]) newSheetData[rowIndex] = [];
                              newSheetData[rowIndex][colIndex] = newValue;
                              setSheetData(newSheetData);
                              setHasUnsavedChanges(true);
                            }}
                            onBlur={() => {
                              setEditingCell(null);
                              // Auto-save to Google Sheets when losing focus
                              if (hasUnsavedChanges) {
                                saveToGoogleSheets();
                              }
                            }}
                            onKeyDown={(e) => handleKeyPress(e, rowIndex, colIndex)}
                            className="w-full h-8 border-none bg-transparent p-1 text-sm focus:ring-0"
                            autoFocus
                          />
                        ) : (
                          <div className="w-full h-8 p-1 text-sm flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
                            {cellValue}
                          </div>
                        )}
                        
                        {/* Selection indicator */}
                        {isSelected && !isEditing && (
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Status bar */}
      {selectedCell && (
        <div className="text-xs text-muted-foreground p-2 border-t bg-slate-50 dark:bg-slate-800">
          Seçili hücre: {getColumnLetter(selectedCell.col)}{selectedCell.row + 1}
          {sheetData[selectedCell.row]?.[selectedCell.col] && 
            ` = "${sheetData[selectedCell.row][selectedCell.col]}"`
          }
        </div>
      )}
    </div>
  );
}
