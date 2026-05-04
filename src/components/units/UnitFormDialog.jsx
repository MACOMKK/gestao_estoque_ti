import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Save, Loader2 } from 'lucide-react';

const emptyForm = {
  name: '', city: '', address: '', phone: '', manager: '', status: 'ativa',
};

export default function UnitFormDialog({ open, onOpenChange, unit, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (unit) {
      setForm({
        name: unit.name || '',
        city: unit.city || '',
        address: unit.address || '',
        phone: unit.phone || '',
        manager: unit.manager || '',
        status: unit.status || 'ativa',
      });
    } else {
      setForm(emptyForm);
    }
  }, [unit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (unit) {
        await base44.entities.Unit.update(unit.id, form);
      } else {
        await base44.entities.Unit.create(form);
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      const message = error?.message || 'Falha ao salvar unidade no Supabase.';
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">
            {unit ? 'Editar Unidade' : 'Nova Unidade'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome da Unidade *</Label>
            <Input required value={form.name} onChange={e => update('name', e.target.value)} placeholder="ex: Macom Belém" />
          </div>
          <div className="space-y-1.5">
            <Label>Cidade *</Label>
            <Input required value={form.city} onChange={e => update('city', e.target.value)} placeholder="ex: Belém" />
          </div>
          <div className="space-y-1.5">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Rua, número, bairro" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(91) 3000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Responsável pela Unidade</Label>
            <Input value={form.manager} onChange={e => update('manager', e.target.value)} placeholder="Nome do gerente/responsável" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {unit ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
