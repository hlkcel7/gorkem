import React, { useEffect, useMemo, useState } from 'react';
import { useInfoCenterPage } from '@/hooks/useInfoCenterPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// PrimeReact styles (imported here to keep changes localized)
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { ProgressBar } from 'primereact/progressbar';

// Local styles for filter layout (from user)
const filterStyles = `
.ui-filter-column .ui-column-customfilter .custom-filter {
    width: 100%;
    box-sizing: border-box;
}
`;

function WebUrlBody(rowData: any) {
  const url = rowData?.web_url || rowData?.weburl;
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
      Link
    </a>
  ) : (
    ''
  );
}

function DateBody(rowData: any) {
  const d = rowData?.letter_date;
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return <span>{dt.toLocaleDateString()}</span>;
}

function SeverityBody(rowData: any) {
  const v = rowData?.severity_rate;
  const raw = Number(v);
  const num = Number.isFinite(raw) ? raw : 0;
  // expected scale 0-10 -> convert to percent
  const pct = Math.max(0, Math.min(100, (num / 10) * 100));
  return (
    <div className="flex items-center gap-2" style={{ alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <ProgressBar value={pct} showValue={false} style={{ height: '0.5rem', background: '#f0f0f0' }} />
      </div>
      <div style={{ minWidth: 48, textAlign: 'right', fontSize: 12 }}>{num}/10</div>
    </div>
  );
}

export default function InfoCenterPage(): JSX.Element {
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [filters, setFilters] = useState<any>(null);
  const [globalFilterOnly, setGlobalFilterOnly] = useState<boolean>(false);
  const [savedFilters, setSavedFilters] = useState<any>(null);
  // debounce the global filter to avoid firing a request on every keystroke
  const [debouncedFilter, setDebouncedFilter] = useState<string>('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(globalFilter), 300);
    return () => clearTimeout(t);
  }, [globalFilter]);

  // Server-side pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const pageQuery = useInfoCenterPage({ pageIndex, pageSize, search: debouncedFilter });
  const pageResult = pageQuery.data as { rows: any[]; total: number } | undefined;
  const data = pageResult?.rows || [];
  const totalRecords = pageResult?.total ?? 0;
  const isLoading = pageQuery.isLoading;
  const error = pageQuery.error;

  useEffect(() => {
    if (error) console.error('Info Center error', error);
  }, [error]);

  // Initialize filters when data arrives
  useEffect(() => {
    setFilters({
      global: { value: null, matchMode: 'contains' },
      letter_no: { value: null, matchMode: 'contains' },
      short_desc: { value: null, matchMode: 'contains' },
      ref_letters: { value: null, matchMode: 'contains' },
      severity_rate: { value: null, matchMode: 'equals' },
      letter_date: { value: null, matchMode: 'between' },
    });
  }, [data]);

  const severityOptions = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((r: any) => {
      if (r?.severity_rate) set.add(String(r.severity_rate));
    });
    return Array.from(set).map((s) => ({ label: s, value: s }));
  }, [data]);

  // header moved into CardHeader to avoid overlapping the Card title

  const footer = (
    <div className="flex align-items-center justify-content-center">
      <span>
        Total documents: {totalRecords}
      </span>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <style>{filterStyles + `
        /* PrimeReact-specific filter elements full width */
        .p-column-filter .p-inputtext,
        .p-column-filter .p-dropdown,
        .p-column-filter .p-calendar,
        .p-column-filter .p-inputnumber {
          width: 100% !important;
          box-sizing: border-box;
        }
        .p-datatable .p-datatable-thead > tr > th {
          vertical-align: middle;
        }
        /* row separators: faint light line */
        .p-datatable .p-datatable-tbody > tr > td {
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        /* ensure header search sits above table and doesn't overlap */
        .card-header .p-input-icon-left {
          z-index: 5;
        }
      `}</style>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center w-full">
              <CardTitle>INFO CENTER</CardTitle>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ marginRight: 8 }}>
                  <InputText
                    placeholder="Enter keyword"
                    value={globalFilter}
                    onChange={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      setGlobalFilter(v);
                      if (globalFilterOnly) {
                        setFilters({ global: { value: v, matchMode: 'contains' } });
                      } else {
                        setFilters((f: any) => ({ ...f, global: { ...(f?.global || {}), value: v } }));
                      }
                    }}
                    style={{ width: '12rem' }}
                  />
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!globalFilterOnly) {
                      setSavedFilters(filters);
                      setFilters({ global: { value: globalFilter || null, matchMode: 'contains' } });
                      setGlobalFilterOnly(true);
                    } else {
                      setFilters(savedFilters || filters);
                      setGlobalFilterOnly(false);
                    }
                  }}
                >
                  Global Filter Only
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          {isLoading ? (
            <div className="p-6">Veriler ekleniyor...</div>
          ) : error ? (
            <div className="p-6 text-red-600">Veri Çekilemedi: {String(error)}</div>
          ) : (
            <div>
              <DataTable
                value={data || []}
                lazy
                paginator
                first={pageIndex * pageSize}
                rows={pageSize}
                totalRecords={totalRecords}
                onPage={(e: any) => {
                  setPageIndex(Math.floor(e.first / e.rows));
                  setPageSize(e.rows);
                }}
                responsiveLayout="scroll"
                footer={footer}
                filters={filters}
                filterDisplay="row"
                globalFilterFields={["letter_no", "short_desc", "keywords", "ref_letters"]}
                emptyMessage="No records found"
                className="p-datatable-gridlines"
              >
                <Column field="letter_no" header="letter_no" sortable filter filterPlaceholder="Filter By letter_no" />
                <Column field="letter_date" header="letter_date" sortable body={DateBody} filter filterElement={<Calendar dateFormat="yy-mm-dd" selectionMode="range" onChange={(e) => setFilters((f: any) => ({ ...f, letter_date: { value: e.value, matchMode: 'between' } }))} />} />
                <Column field="short_desc" header="short_desc" sortable filter filterPlaceholder="Filter By short_desc" />
                <Column field="ref_letters" header="ref_letters" sortable filter filterPlaceholder="Filter By ref_letters" />
                <Column field="severity_rate" header="severity_rate" sortable body={SeverityBody} filter filterElement={<Dropdown options={severityOptions} onChange={(e) => setFilters((f: any) => ({ ...f, severity_rate: { value: e.value, matchMode: 'equals' } }))} placeholder="All" />} />
                <Column field="keywords" header="keywords" sortable filter filterPlaceholder="Filter By keywords" />
                <Column field="web_url" header="web_url" body={WebUrlBody} />
              </DataTable>
            </div>
          )}
          </CardContent>
      </Card>
    </div>
  );
}
