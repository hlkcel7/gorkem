import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { googleSheetsClient } from "@/services/googleSheets";
import { useQueryClient } from "@tanstack/react-query";

interface RenameSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetId: string | null;
  currentName: string;
  onSuccess: () => void;
}

const SPREADSHEET_ID = () => {
  const config = (window as any).__APP_CONFIG__;
  return config?.GOOGLE_SPREADSHEET_ID || 'YOUR_SPREADSHEET_ID_HERE';
};

export default function RenameSheetModal({ isOpen, onClose, sheetId, currentName, onSuccess }: RenameSheetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<{ name: string }>({
    resolver: zodResolver({ name: (v: any) => (typeof v === 'string' && v.trim().length > 0 ? true : 'Gerekli') } as any),
    defaultValues: { name: currentName || '' },
  });

  const onSubmit = async (values: { name: string }) => {
    if (!sheetId) return;
    try {
      // Google Sheets API'sinde sheet'i yeniden adlandır
      await googleSheetsClient.renameSheet(SPREADSHEET_ID(), parseInt(sheetId), values.name.trim());
      
      // Cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
      
      toast({ title: 'Yeniden adlandırıldı', description: 'Sheet adı güncellendi.' });
      onSuccess();
    } catch (err) {
      console.error('Rename sheet error:', err);
      toast({ title: 'Hata', description: 'Sheet adı güncellenemedi.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="modal-rename-sheet">
        <DialogHeader>
          <DialogTitle>Sheet Yeniden Adlandır</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yeni İsim</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Yeni sheet adı" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>İptal</Button>
              <Button type="submit" className="flex-1">Kaydet</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
