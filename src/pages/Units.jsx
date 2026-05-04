import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Building2, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import UnitFormDialog from '@/components/units/UnitFormDialog';

export default function Units() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deleteUnit, setDeleteUnit] = useState(null);

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list('-created_date'),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['units'] });

  const handleDelete = async () => {
    await base44.entities.Unit.delete(deleteUnit.id);
    setDeleteUnit(null);
    refresh();
  };

  const getUnitAssets = (unitId) => assets.filter(a => a.unit_id === unitId).length;
  const getUnitEmployees = (unitId) => employees.filter(e => e.unit_id === unitId).length;

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
          <h1 className="text-3xl font-extrabold tracking-tight">Unidades / Filiais</h1>
          <p className="text-muted-foreground mt-1">{units.length} unidade{units.length !== 1 ? 's' : ''} cadastrada{units.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditingUnit(null); setFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Unidade
        </Button>
      </div>

      {units.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">Nenhuma unidade cadastrada</p>
          <p className="text-sm text-muted-foreground mt-1">Cadastre as filiais da MACOM para organizar os ativos</p>
          <Button onClick={() => { setEditingUnit(null); setFormOpen(true); }} className="mt-4 gap-2">
            <Plus className="w-4 h-4" /> Cadastrar Primeira Unidade
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {units.map(unit => (
            <Card key={unit.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Red top bar */}
              <div className="h-1.5 bg-primary" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{unit.name}</h3>
                      <p className="text-xs text-muted-foreground">{unit.city}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={unit.status === 'ativa' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}>
                    {unit.status === 'ativa' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {unit.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{unit.address}</span>
                    </div>
                  )}
                  {unit.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{unit.phone}</span>
                    </div>
                  )}
                  {unit.manager && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{unit.manager}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-2xl font-extrabold text-primary">{getUnitAssets(unit.id)}</p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-2xl font-extrabold text-foreground">{getUnitEmployees(unit.id)}</p>
                    <p className="text-xs text-muted-foreground">Colaboradores</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { setEditingUnit(unit); setFormOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteUnit(unit)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UnitFormDialog open={formOpen} onOpenChange={setFormOpen} unit={editingUnit} onSaved={refresh} />

      <AlertDialog open={!!deleteUnit} onOpenChange={(open) => !open && setDeleteUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Unidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteUnit?.name}"? Os ativos e colaboradores vinculados não serão excluídos, mas perderão o vínculo com esta unidade.
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