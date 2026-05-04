import React, { useMemo, useState } from 'react';
import { Upload, Loader2, FileJson, FileSpreadsheet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  result.push(current.trim());
  return result;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    return row;
  });
}

function coerceValue(value) {
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!Number.isNaN(Number(value)) && value.trim() !== '') return Number(value);
  return value;
}

export default function ImportDataDialog({
  open,
  onOpenChange,
  entityName,
  onImported,
  title = 'Importar dados',
  presetFields = {},
  helperText
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const exampleFields = useMemo(() => {
    switch (entityName) {
      case 'Asset':
        return 'tag,name,category,status,condition,unit_id,unit_name';
      case 'Employee':
        return 'full_name,department,status,unit_id,unit_name,email,cpf';
      case 'Info':
        return 'type,title,value,description,unit_id,unit_name';
      default:
        return 'id,name';
    }
  }, [entityName]);

  const templateBaseName = useMemo(() => {
    if (entityName === 'Asset') return 'ativos';
    if (entityName === 'Employee') return 'colaboradores';
    if (entityName === 'Unit') return 'unidades';
    if (entityName === 'Info' && presetFields?.type === 'fornecedor') return 'fornecedores';
    if (entityName === 'Info' && presetFields?.type === 'chip_corporativo') return 'chips';
    if (entityName === 'Info') return 'infraestrutura';
    return null;
  }, [entityName, presetFields]);

  const resetState = () => {
    setFile(null);
    setLoading(false);
    setMessage('');
  };

  const handleClose = (nextOpen) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setMessage('');

    try {
      const text = await file.text();
      const isJson = file.name.toLowerCase().endsWith('.json');
      const rows = isJson ? JSON.parse(text) : parseCsv(text);

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Arquivo vazio ou formato invalido.');
      }

      let success = 0;
      const failures = [];

      for (let i = 0; i < rows.length; i += 1) {
        const raw = rows[i] || {};
        const payload = Object.fromEntries(
          Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? coerceValue(v) : v])
        );

        const finalPayload = { ...payload, ...presetFields };

        try {
          await base44.entities[entityName].create(finalPayload);
          success += 1;
        } catch (err) {
          failures.push(`Linha ${i + 2}: ${err?.message || 'erro ao importar'}`);
        }
      }

      if (success > 0) onImported?.();

      if (failures.length) {
        setMessage(`Importacao parcial: ${success} sucesso(s), ${failures.length} falha(s).`);
      } else {
        setMessage(`Importacao concluida: ${success} registro(s).`);
      }
    } catch (error) {
      setMessage(error?.message || 'Falha na importacao.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold mb-1">Formatos aceitos</p>
            <p className="text-muted-foreground flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> CSV com cabecalho</p>
            <p className="text-muted-foreground flex items-center gap-2"><FileJson className="w-4 h-4" /> JSON (array de objetos)</p>
          </div>

          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold mb-1">Campos esperados (exemplo)</p>
            <p className="font-mono text-xs text-muted-foreground break-all">{exampleFields}</p>
            {helperText && <p className="text-xs text-muted-foreground mt-2">{helperText}</p>}
            {templateBaseName && (
              <div className="mt-2 flex gap-3 text-xs">
                <a href={`/import-templates/${templateBaseName}_template.csv`} download className="text-primary hover:underline">
                  Baixar modelo CSV
                </a>
                <a href={`/import-templates/${templateBaseName}_template.json`} download className="text-primary hover:underline">
                  Baixar modelo JSON
                </a>
              </div>
            )}
          </div>

          <input
            type="file"
            accept=".csv,.json,application/json,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />

          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Fechar
            </Button>
            <Button type="button" disabled={!file || loading} onClick={handleImport} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Importar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
