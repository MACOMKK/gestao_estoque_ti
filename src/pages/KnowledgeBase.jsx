import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, BookOpen, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import KnowledgeFormDialog from '@/components/knowledge/KnowledgeFormDialog';

const categoryColors = {
  TI: 'bg-blue-100 text-blue-800 border-blue-200',
  RH: 'bg-purple-100 text-purple-800 border-purple-200',
  Financeiro: 'bg-amber-100 text-amber-800 border-amber-200',
  Comercial: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Operações: 'bg-orange-100 text-orange-800 border-orange-200',
  Geral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function KnowledgeBase() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['knowledge'],
    queryFn: () => base44.entities.KnowledgeBase.list('-created_date'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['knowledge'] });

  const handleDelete = async () => {
    await base44.entities.KnowledgeBase.delete(deleteItem.id);
    setDeleteItem(null);
    refresh();
  };

  const filtered = items.filter(i => {
    const matchSearch = !search ||
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter;
    const matchType = typeFilter === 'all' || i.type === typeFilter;
    return matchSearch && matchCategory && matchType;
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
          <h1 className="text-3xl font-extrabold tracking-tight">Base de Conhecimento</h1>
          <p className="text-muted-foreground mt-1">{items.length} recurso{items.length !== 1 ? 's' : ''} cadastrado{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Recurso
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por título ou descrição..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="TI">TI</SelectItem>
              <SelectItem value="RH">RH</SelectItem>
              <SelectItem value="Financeiro">Financeiro</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
              <SelectItem value="Operações">Operações</SelectItem>
              <SelectItem value="Geral">Geral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">Nenhum recurso encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Recurso" para adicionar links ou PDFs</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Título</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Descrição</TableHead>
                <TableHead className="font-bold">Tipo</TableHead>
                <TableHead className="font-bold hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm hover:text-primary hover:underline flex items-center gap-1.5"
                    >
                      {item.type === 'pdf'
                        ? <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        : <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      }
                      {item.title}
                    </a>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                    {item.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={item.type === 'pdf' ? 'bg-red-100 text-red-700 border-red-200 text-xs' : 'bg-blue-100 text-blue-700 border-blue-200 text-xs'}>
                      {item.type === 'pdf' ? 'PDF' : 'Link'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {item.category ? (
                      <Badge variant="outline" className={`${categoryColors[item.category] || ''} text-xs`}>{item.category}</Badge>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingItem(item); setFormOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteItem(item)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <KnowledgeFormDialog open={formOpen} onOpenChange={setFormOpen} item={editingItem} onSaved={refresh} />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Recurso</AlertDialogTitle>
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