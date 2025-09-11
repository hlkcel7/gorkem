import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCreateSheet } from "@/hooks/useSheets";
import { createSheetFormSchema, type CreateSheetForm } from "@shared/schema";

interface CreateSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSheetModal({ isOpen, onClose, onSuccess }: CreateSheetModalProps) {
  const { toast } = useToast();
  const createSheetMutation = useCreateSheet();

  const form = useForm<CreateSheetForm>({
    resolver: zodResolver(createSheetFormSchema),
    defaultValues: {
      name: "",
      template: "custom",
    },
  });

  const onSubmit = (data: CreateSheetForm) => {
    createSheetMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Sheet Oluşturuldu",
          description: "Yeni sheet başarıyla oluşturuldu.",
        });
        form.reset();
        onSuccess();
      },
      onError: () => {
        toast({
          title: "Oluşturma Hatası",
          description: "Sheet oluşturulurken bir hata oluştu.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="modal-create-sheet">
        <DialogHeader>
          <DialogTitle>Yeni Sheet Oluştur</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sheet Adı</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Örn: Muhasebe 2025" 
                      {...field} 
                      data-testid="input-sheet-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                              <FormItem>
                <FormLabel>Şablon</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Bir şablon seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="custom">🔧 Özel Tablo</SelectItem>
                    <SelectItem value="income-tracking">💰 Gelirler Tablosu</SelectItem>
                    <SelectItem value="expense-tracking">📊 Giderler Tablosu</SelectItem>
                    <SelectItem value="project-tracking">🏗️ Projeler Tablosu</SelectItem>
                    <SelectItem value="bank-accounts">🏦 Banka Hesapları</SelectItem>
                    <SelectItem value="upcoming-payments">⏰ Yaklaşan Ödemeler</SelectItem>
                    <SelectItem value="subsidiaries">🏢 İştirakler</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
              )}
            />
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={onClose}
                data-testid="button-cancel-sheet"
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createSheetMutation.isPending}
                data-testid="button-create-sheet-submit"
              >
                {createSheetMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
