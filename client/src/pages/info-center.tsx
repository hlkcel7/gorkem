import React, { useEffect } from 'react';
import { useInfoCenterData } from '@/hooks/useInfoCenterData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// PrimeReact styles (imported here to keep changes localized)
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export default function InfoCenterPage() {
  const { data, isLoading, error } = useInfoCenterData(200);

  useEffect(() => {
    if (error) console.error('Info Center error', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>INFO CENTER</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6">Yükleniyor...</div>
          ) : error ? (
            <div className="p-6 text-red-600">Veri çekilemedi: {String(error)}</div>
          ) : (
            <div>
              <DataTable value={data || []} paginator rows={25} responsiveLayout="scroll">
                <Column field="letter_no" header="Letter No" />
                <Column field="letter_date" header="Letter Date" />
                <Column field="short_desc" header="Short Description" />
                <Column field="ref_letters" header="Ref Letters" />
                <Column field="severity_rate" header="Severity" />
                <Column field="keywords" header="Keywords" />
                <Column field="weburl" header="Web URL" body={(row: any) => row.weburl ? <a href={row.weburl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a> : ''} />
              </DataTable>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
