import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';

const departments = ['TI', 'Administrativo', 'Financeiro', 'Comercial', 'RH', 'Pós-Vendas', 'Diretoria', 'Marketing', 'Operações', 'Outro'];
const employeeStatuses = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
];

const emptyForm = {
  full_name: '', cpf: '', email: '', phone: '',
  department: '', role: '', admission_date: '', status: 'ativo',
  unit_id: '', unit_name: '',
};

const normalizeText = (value) => (value || '').trim().toLowerCase();
const normalizeCpf = (value) => (value || '').replace(/\D/g, '');

export default function EmployeeFormDialog({ open, onOpenChange, employee, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [unlinkAssetsOnInactive, setUnlinkAssetsOnInactive] = useState(false);

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.filter({ status: 'ativa' }),
    enabled: open,
  });

  useEffect(() => {
    if (employee) {
      setForm({
        full_name: employee.full_name || '',
        cpf: employee.cpf || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        role: employee.role || '',
        admission_date: employee.admission_date || '',
        status: employee.status || 'ativo',
        unit_id: employee.unit_id || '',
        unit_name: employee.unit_name || '',
      });
      setUnlinkAssetsOnInactive(false);
    } else {
      setForm(emptyForm);
      setUnlinkAssetsOnInactive(false);
    }
  }, [employee, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.department) {
      window.alert('Selecione o departamento do colaborador.');
      return;
    }
    if (!form.email?.trim()) {
      window.alert('Email e obrigatorio para envio de termo.');
      return;
    }
    if (!form.phone?.trim()) {
      window.alert('Telefone e obrigatorio para envio de termo.');
      return;
    }
    setSaving(true);
    try {
      const shouldUnlinkAssets = !!employee && unlinkAssetsOnInactive;

      if (employee) {
        await base44.entities.Employee.update(employee.id, form);
      } else {
        await base44.entities.Employee.create(form);
      }

      if (shouldUnlinkAssets) {
        const allAssets = await base44.entities.Asset.list();
        const names = [employee?.full_name, form.full_name]
          .map(normalizeText)
          .filter(Boolean);
        const emails = [employee?.email, form.email]
          .map(normalizeText)
          .filter(Boolean);
        const cpfs = [employee?.cpf, form.cpf]
          .map(normalizeCpf)
          .filter(Boolean);

        const linkedAssets = allAssets.filter((asset) => {
          const matchName = names.includes(normalizeText(asset.assigned_to));
          const matchEmail = emails.includes(normalizeText(asset.assigned_to_email));
          const matchCpf = cpfs.includes(normalizeCpf(asset.assigned_to_cpf));
          return matchName || matchEmail || matchCpf;
        });

        await Promise.all(
          linkedAssets.map((asset) =>
            base44.entities.Asset.update(asset.id, {
              status: 'disponivel',
              assigned_to: '',
              assigned_to_email: '',
              assigned_to_cpf: '',
              assigned_to_department: '',
              assignment_date: ''
            })
          )
        );

        window.alert(`${linkedAssets.length} ativo(s) desvinculado(s).`);
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar colaborador:', error);
      window.alert(error?.message || 'Falha ao salvar colaborador.');
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    setForm(prev => ({ ...prev, unit_id: unitId, unit_name: unit?.name || '' }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">
            {employee ? 'Editar Colaborador' : 'Novo Colaborador'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Nome Completo *</Label>
              <Input required value={form.full_name} onChange={e => update('full_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={e => update('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input required type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input required value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(91) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>Departamento *</Label>
              <Select value={form.department} onValueChange={v => update('department', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input value={form.role} onChange={e => update('role', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Admissão</Label>
              <Input type="date" value={form.admission_date} onChange={e => update('admission_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {employeeStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {employee && (
              <div className="md:col-span-2 rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium">Ações de vínculo</p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="unlink-assets-on-inactive"
                    checked={unlinkAssetsOnInactive}
                    onCheckedChange={(checked) => setUnlinkAssetsOnInactive(checked === true)}
                  />
                  <Label htmlFor="unlink-assets-on-inactive" className="text-sm leading-5 cursor-pointer">
                    Desvincular todos os ativos da posse deste colaborador ao salvar
                  </Label>
                </div>
              </div>
            )}
            <div className="md:col-span-2 space-y-1.5">
              <Label>Unidade / Filial</Label>
              <Select value={form.unit_id} onValueChange={handleUnitChange}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {employee ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
