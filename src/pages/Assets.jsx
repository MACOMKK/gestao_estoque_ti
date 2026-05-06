import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UserPlus, Pencil, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { StatusBadge, getCategoryLabel } from '@/components/assets/AssetStatusBadge';
import AssetFormDialog from '@/components/assets/AssetFormDialog';
import AssignAssetDialog from '@/components/assets/AssignAssetDialog';
import ImportDataDialog from '@/components/ImportDataDialog';
import { useAuth } from '@/lib/AuthContext';

export default function Assets() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [deleteAsset, setDeleteAsset] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['assets'] });

  const handleExportCSV = () => {
    const headers = ['Código', 'Nome', 'Categoria', 'Marca', 'Modelo', 'Nº Série', 'Status', 'Conservação', 'Unidade', 'Localização', 'Responsável', 'Dept. Responsável', 'Data Vínculo', 'Data Aquisição', 'Valor (R$)', 'Observações'];
    const statusLabel = { disponivel: 'Disponível', em_uso: 'Em Uso', manutencao: 'Manutenção', descartado: 'Descartado' };
    const conditionLabel = { novo: 'Novo', bom: 'Bom', regular: 'Regular', ruim: 'Ruim' };
    const rows = filtered.map(a => [
      a.tag || '',
      a.name || '',
      getCategoryLabel(a.category),
      a.brand || '',
      a.model || '',
      a.serial_number || '',
      statusLabel[a.status] || a.status || '',
      conditionLabel[a.condition] || a.condition || '',
      a.unit_name || '',
      a.location || '',
      a.assigned_to || '',
      a.assigned_to_department || '',
      a.assignment_date || '',
      a.purchase_date || '',
      a.purchase_value || '',
      a.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ativos_macom_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    await base44.entities.Asset.delete(deleteAsset.id);
    setDeleteAsset(null);
    refresh();
  };

  const filtered = assets.filter(a => {
    const matchSearch = !search || 
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.tag?.toLowerCase().includes(search.toLowerCase()) ||
      a.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_to?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || a.category === categoryFilter;
    const matchUnit = unitFilter === 'all' || a.unit_id === unitFilter;
    return matchSearch && matchStatus && matchCategory && matchUnit;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ativos</h1>
          <p className="text-muted-foreground mt-1">{assets.length} equipamentos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                <Upload className="w-4 h-4" /> Importar
              </Button>
              <Button onClick={() => { setEditingAsset(null); setFormOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Novo Ativo
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, código, série ou responsável..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="em_uso">Em Uso</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="descartado">Descartado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="notebook">Notebook</SelectItem>
              <SelectItem value="monitor">Monitor</SelectItem>
              <SelectItem value="tv">TV</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="impressora">Impressora</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Unidades</SelectItem>
              {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Código</TableHead>
                <TableHead className="font-bold">Equipamento</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Categoria</TableHead>
                <TableHead className="font-bold hidden lg:table-cell">Nº Série</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold hidden lg:table-cell">Unidade</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Responsável</TableHead>
                <TableHead className="font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum ativo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(asset => (
                  <TableRow key={asset.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">{asset.tag || '—'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.brand} {asset.model}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{getCategoryLabel(asset.category)}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs">{asset.serial_number || '—'}</TableCell>
                    <TableCell><StatusBadge status={asset.status} /></TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{asset.unit_name || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{asset.assigned_to || '—'}</TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedAsset(asset); setAssignOpen(true); }}>
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAsset(asset); setFormOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteAsset(asset)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {isAdmin && (
        <>
          <AssetFormDialog open={formOpen} onOpenChange={setFormOpen} asset={editingAsset} onSaved={refresh} />
          <AssignAssetDialog open={assignOpen} onOpenChange={setAssignOpen} asset={selectedAsset} onSaved={refresh} />
          <ImportDataDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            entityName="Asset"
            title="Importar Ativos"
            onImported={refresh}
          />
        </>
      )}

      <AlertDialog open={isAdmin && !!deleteAsset} onOpenChange={(open) => !open && setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ativo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteAsset?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
