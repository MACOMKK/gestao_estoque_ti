import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Loader2, UserMinus } from 'lucide-react';
import { format } from 'date-fns';

export default function AssignAssetDialog({ open, onOpenChange, asset, onSaved }) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assignDate, setAssignDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: () => base44.entities.Employee.filter({ status: 'ativo' }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setSelectedEmployee('');
      setAssignDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [open]);

  const handleAssign = async () => {
    setSaving(true);
    const emp = employees.find(e => e.id === selectedEmployee);
    await base44.entities.Asset.update(asset.id, {
      assigned_to: emp.full_name,
      assigned_to_email: emp.email || '',
      assigned_to_cpf: emp.cpf || '',
      assigned_to_department: emp.department || '',
      assignment_date: assignDate,
      status: 'em_uso',
    });
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const handleUnassign = async () => {
    setSaving(true);
    await base44.entities.Asset.update(asset.id, {
      assigned_to: '',
      assigned_to_email: '',
      assigned_to_cpf: '',
      assigned_to_department: '',
      assignment_date: '',
      status: 'disponivel',
    });
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const isAssigned = asset?.assigned_to;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-extrabold">
            {isAssigned ? 'Gerenciar Vínculo' : 'Vincular Colaborador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-medium">Equipamento</p>
            <p className="font-bold text-sm">{asset?.name}</p>
            <p className="text-xs text-muted-foreground">{asset?.tag} · {asset?.serial_number}</p>
          </div>

          {isAssigned && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium">Vinculado a</p>
              <p className="font-bold text-sm">{asset.assigned_to}</p>
              <p className="text-xs text-muted-foreground">{asset.assigned_to_department} · Desde {asset.assignment_date}</p>
              <Button variant="destructive" size="sm" className="mt-3 gap-2" onClick={handleUnassign} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                Desvincular
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{isAssigned ? 'Transferir para' : 'Colaborador'}</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} — {emp.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data do Vínculo</Label>
              <Input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedEmployee || saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isAssigned ? 'Transferir' : 'Vincular'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}