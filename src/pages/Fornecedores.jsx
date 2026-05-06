import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Package, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import FornecedorFormDialog from '@/components/contatos/FornecedorFormDialog';
import ImportDataDialog from '@/components/ImportDataDialog';
import { useAuth } from '@/lib/AuthContext';

export default function Fornecedores() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: infos = [], isLoading } = useQuery({
    queryKey: ['infos'],
    queryFn: () => base44.entities.Info.list('-created_date'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['infos'] });

  const handleDelete = async () => {
    await base44.entities.Info.delete(deleteItem.id);
    setDeleteItem(null);
    refresh();
  };

  const items = infos.filter(i => i.type === 'fornecedor').filter(i =>
    !search ||
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.contact_phone?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-3xl font-extrabold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">{items.length} fornecedor{items.length !== 1 ? 'es' : ''} cadastrado{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                <Upload className="w-4 h-4" /> Importar
              </Button>
              <Button onClick={() => { setEditingItem(null); setFormOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Novo Fornecedor
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, contato..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">Nenhum fornecedor cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Fornecedor" para começar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Fornecedor</Badge>
                    {item.unit_name && <span className="text-xs text-muted-foreground">{item.unit_name}</span>}
                  </div>
                  <p className="font-bold text-sm">{item.title}</p>
                  {item.value && <p className="text-xs text-muted-foreground mt-0.5">{item.value}</p>}
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  {(item.contact_name || item.contact_phone || item.contact_email) && (
                    <div className="mt-2 pt-2 border-t border-border space-y-0.5">
                      {item.contact_name && <p className="text-xs font-semibold">{item.contact_name}</p>}
                      {item.contact_phone && <p className="text-xs text-muted-foreground">{item.contact_phone}</p>}
                      {item.contact_email && <p className="text-xs text-muted-foreground">{item.contact_email}</p>}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItem(item); setFormOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteItem(item)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && (
        <>
          <FornecedorFormDialog open={formOpen} onOpenChange={setFormOpen} info={editingItem} onSaved={refresh} />
          <ImportDataDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            entityName="Info"
            title="Importar Fornecedores"
            presetFields={{ type: 'fornecedor' }}
            helperText="O campo type sera preenchido automaticamente como fornecedor."
            onImported={refresh}
          />
        </>
      )}

      <AlertDialog open={isAdmin && !!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir "{deleteItem?.title}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
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
