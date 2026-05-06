import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Monitor, Upload, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmployeeFormDialog from '@/components/employees/EmployeeFormDialog';
import CreateAccessDialog from '@/components/employees/CreateAccessDialog';
import ImportDataDialog from '@/components/ImportDataDialog';
import { useAuth } from '@/lib/AuthContext';

export default function Employees() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessEmployee, setAccessEmployee] = useState(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.EmployeeAccess.list('-created_date'),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['employees'] });

  const handleDelete = async () => {
    try {
      await base44.entities.Employee.delete(deleteEmployee.id);
      setDeleteEmployee(null);
      refresh();
    } catch (error) {
      window.alert(error?.message || 'Falha ao excluir colaborador.');
    }
  };

  const getAssetCount = (employeeName) => {
    return assets.filter(a => a.assigned_to === employeeName).length;
  };

  const filtered = employees.filter(e => {
    const matchSearch = !search || 
      e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase());
    const matchUnit = unitFilter === 'all' || e.unit_id === unitFilter;
    return matchSearch && matchUnit;
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
          <h1 className="text-3xl font-extrabold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground mt-1">{employees.length} colaboradores cadastrados</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                <Upload className="w-4 h-4" /> Importar
              </Button>
              <Button onClick={() => { setEditingEmployee(null); setFormOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Novo Colaborador
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, telefone ou departamento..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Nome</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Telefone</TableHead>
                <TableHead className="font-bold">Departamento</TableHead>
                <TableHead className="font-bold hidden lg:table-cell">Cargo</TableHead>
                <TableHead className="font-bold hidden lg:table-cell">Acesso</TableHead>
                <TableHead className="font-bold text-center">Equipamentos</TableHead>
                <TableHead className="font-bold hidden lg:table-cell">Unidade</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Status</TableHead>
                <TableHead className="font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum colaborador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(emp => (
                  <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{emp.full_name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm font-mono">
                      {emp.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">{emp.department}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{emp.role || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {(() => {
                        const perfil = emp.perfil_acesso;
                        if (perfil === 'admin') {
                          return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
                        }
                        if (perfil === 'user') {
                          return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">User</Badge>;
                        }
                        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">User</Badge>;
                      })()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-bold text-sm">{getAssetCount(emp.full_name)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{emp.unit_name || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className={emp.status === 'ativo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}>
                        {emp.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setAccessEmployee(emp);
                              setAccessOpen(true);
                            }}
                            title="Criar acesso"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingEmployee(emp); setFormOpen(true); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteEmployee(emp)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
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
          <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={editingEmployee} onSaved={refresh} />
          <CreateAccessDialog open={accessOpen} onOpenChange={setAccessOpen} employee={accessEmployee} />
          <ImportDataDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            entityName="Employee"
            title="Importar Colaboradores"
            onImported={refresh}
          />
        </>
      )}

      <AlertDialog open={isAdmin && !!deleteEmployee} onOpenChange={(open) => !open && setDeleteEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Colaborador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteEmployee?.full_name}"? Esta ação não pode ser desfeita.
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
