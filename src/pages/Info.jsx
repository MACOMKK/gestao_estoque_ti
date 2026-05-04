import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Globe, Wifi, Phone, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import InfoFormDialog from '@/components/info/InfoFormDialog';

const typeConfig = {
  ip: { label: 'IP', icon: Wifi, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  sistema: { label: 'Sistema', icon: Globe, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  fornecedor: { label: 'Fornecedor', icon: Package, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  chip_corporativo: { label: 'Chip Corporativo', icon: Phone, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

export default function Info() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState(null);
  const [deleteInfo, setDeleteInfo] = useState(null);

  const { data: infos = [], isLoading } = useQuery({
    queryKey: ['infos'],
    queryFn: () => base44.entities.Info.list('-created_date'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['infos'] });

  const handleDelete = async () => {
    await base44.entities.Info.delete(deleteInfo.id);
    setDeleteInfo(null);
    refresh();
  };

  const filtered = infos.filter(i => {
    const matchType = typeFilter === 'all' || i.type === typeFilter;
    const matchSearch = !search ||
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.value?.toLowerCase().includes(search.toLowerCase()) ||
      i.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const grouped = ['ip', 'sistema', 'fornecedor', 'chip_corporativo'].reduce((acc, type) => {
    const items = filtered.filter(i => i.type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

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
          <h1 className="text-3xl font-extrabold tracking-tight">Informações Úteis</h1>
          <p className="text-muted-foreground mt-1">IPs, sistemas, fornecedores e chips corporativos</p>
        </div>
        <Button onClick={() => { setEditingInfo(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Informação
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="ip">IP</SelectItem>
              <SelectItem value="sistema">Sistema</SelectItem>
              <SelectItem value="fornecedor">Fornecedor</SelectItem>
              <SelectItem value="chip_corporativo">Chip Corporativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {Object.keys(grouped).length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">Nenhuma informação cadastrada</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Informação" para começar</p>
        </Card>
      ) : (
        Object.entries(grouped).map(([type, items]) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{config.label}</h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map(info => (
                  <Card key={info.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={config.color + ' text-xs'}>{config.label}</Badge>
                          {info.unit_name && <span className="text-xs text-muted-foreground">{info.unit_name}</span>}
                        </div>
                        <p className="font-bold text-sm">{info.title}</p>
                        {info.value && (
                          <p className="text-xs font-mono mt-1 text-primary break-all">
                            {info.type === 'sistema' ? (
                              <a href={info.value} target="_blank" rel="noopener noreferrer" className="hover:underline">{info.value}</a>
                            ) : info.value}
                          </p>
                        )}
                        {info.description && <p className="text-xs text-muted-foreground mt-1">{info.description}</p>}
                        {(info.contact_name || info.contact_phone || info.contact_email) && (
                          <div className="mt-2 pt-2 border-t border-border space-y-0.5">
                            {info.assigned_to && <p className="text-xs font-semibold text-primary">👤 {info.assigned_to}{info.assigned_to_department ? ` · ${info.assigned_to_department}` : ''}</p>}
                            {info.contact_name && <p className="text-xs font-medium">{info.contact_name}</p>}
                            {info.contact_phone && <p className="text-xs text-muted-foreground">{info.contact_phone}</p>}
                            {info.contact_email && <p className="text-xs text-muted-foreground">{info.contact_email}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingInfo(info); setFormOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteInfo(info)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}

      <InfoFormDialog open={formOpen} onOpenChange={setFormOpen} info={editingInfo} onSaved={refresh} />

      <AlertDialog open={!!deleteInfo} onOpenChange={(open) => !open && setDeleteInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Informação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteInfo?.title}"? Esta ação não pode ser desfeita.
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