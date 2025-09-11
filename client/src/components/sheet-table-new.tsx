import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUpdateRecord } from "@/hooks/useSheets";

interface SheetTableProps {
  headers: string[];
  records: any[];
  sheetName: string;
  onDataChange: () => void;
}

export default function SheetTable({ headers, records, sheetName, onDataChange }: SheetTableProps) {
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;
  const { toast } = useToast();

  const updateRecordMutation = useUpdateRecord();

  const handleCellUpdate = async (rowIndex: number, colIndex: number, value: string) => {
    try {
      const record = { ...records[rowIndex] };
      const headerKey = headers[colIndex];
      record[headerKey] = value;
      
      await updateRecordMutation.mutateAsync({
        sheetName,
        rowIndex,
        record
      });
      
      onDataChange();
      toast({
        title: "Kayıt Güncellendi",
        description: "Kayıt başarıyla güncellendi.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kayıt güncellenemedi.",
      });
    } finally {
      setEditingCell(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      handleCellUpdate(rowIndex, colIndex, input.value);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedRecords = records.slice(startIndex, endIndex);

  if (records.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>Henüz kayıt bulunmuyor.</p>
          <p className="text-sm">Yeni kayıt eklemek için yukarıdaki "Kayıt Ekle" butonunu kullanın.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {headers.map((header, index) => (
                  <th key={index} className="p-3 text-left font-medium text-muted-foreground">
                    {header}
                  </th>
                ))}
                <th className="p-3 text-left font-medium text-muted-foreground w-20">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record, rowIndex) => (
                <tr key={rowIndex} className="border-b hover:bg-muted/50">
                  {headers.map((header, colIndex) => (
                    <td key={colIndex} className="p-3">
                      {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                        <Input
                          defaultValue={record[header] || ''}
                          autoFocus
                          onBlur={(e) => handleCellUpdate(rowIndex, colIndex, e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, rowIndex, colIndex)}
                          className="min-w-[100px]"
                        />
                      ) : (
                        <div
                          className="min-h-[20px] cursor-pointer hover:bg-muted/50 p-1 rounded"
                          onClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
                        >
                          {record[header] || '-'}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Handle delete if needed
                      }}
                    >
                      ⚡
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {records.length > recordsPerPage && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, records.length)} / {records.length} kayıt
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Önceki
            </Button>
            <span className="text-sm">
              Sayfa {currentPage} / {Math.ceil(records.length / recordsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(records.length / recordsPerPage), prev + 1))}
              disabled={currentPage >= Math.ceil(records.length / recordsPerPage)}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
