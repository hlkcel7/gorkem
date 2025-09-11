import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Sheet, SheetData, DashboardData } from "@shared/schema";

export function useSheets() {
  return useQuery<Sheet[]>({
    queryKey: ["/api/sheets"],
  });
}

export function useSheetData(sheetId: string | undefined) {
  return useQuery<SheetData>({
    queryKey: ["/api/sheets", sheetId, "data"],
    enabled: !!sheetId,
  });
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });
}

export function useSyncData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiRequest("POST", "/api/sync"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sheets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}

export function useCreateSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; template: string }) =>
      apiRequest("POST", "/api/sheets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sheets"] });
    },
  });
}

export function useDeleteSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sheetId: string) => apiRequest("DELETE", `/api/sheets/${sheetId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sheets"] });
    },
  });
}

export function useAddRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sheetId, data }: { sheetId: string; data: any }) =>
      apiRequest("POST", `/api/sheets/${sheetId}/records`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sheets", variables.sheetId, "data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sheetId, rowIndex, data }: { sheetId: string; rowIndex: number; data: any[] }) =>
      apiRequest("PUT", `/api/sheets/${sheetId}/records/${rowIndex}`, { data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sheets", variables.sheetId, "data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}
