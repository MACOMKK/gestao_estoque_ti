import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';

const emptyForm = {
  type: 'fornecedor',
  title: '', value: '', description: '',
  contact_name: '', contact_email: '', contact_phone: '',
  unit_id: '', unit_name: '',
};

export default function FornecedorFormDialog({ open, onOpenChange, info, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
    enabled: open,
  });

  useEffect(() => {
    if (info) {
      setForm({
        type: 'fornecedor',
        title: info.title || '',
        value: info.value || '',
        description: info.description || '',
        contact_name: info.contact_name || '',
        contact_email: info.contact_email || '',
        contact_phone: info.contact_phone || '',
        unit_id: info.unit_id || '',
        unit_name: info.unit_name || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [info, open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleUnitChange = (unitId) => {
    if (unitId === 'none') {
      setForm(prev => ({ ...prev, unit_id: '', unit_name: '' }));
      return;
    }
    const unit = units.find(u => u.id === unitId);
    setForm(prev => ({ ...prev, unit_id: unitId, unit_name: unit?.name || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (info) {
      await base44.entities.Info.update(info.id, form);
    } else {
      await base44.entities.Info.create(form);
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">
            {info ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome do Fornecedor *</Label>
            <Input required value={form.title} onChange={e => update('title', e.target.value)} placeholder="ex: Dell, Claro, Fortinet..." />
          </div>

          <div className="space-y-1.5">
            <Label>CNPJ / Identificador</Label>
            <Input value={form.value} onChange={e => update('value', e.target.value)} placeholder="00.000.000/0001-00" />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição / Serviço prestado</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} placeholder="O que esse fornecedor fornece..." />
          </div>

          <div className="space-y-1.5">
            <Label>Nome do Contato</Label>
            <Input value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Nome do responsável" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} placeholder="(91) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="contato@empresa.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Unidade / Filial</Label>
            <Select value={form.unit_id || 'none'} onValueChange={handleUnitChange}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todas as unidades</SelectItem>
                {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.city}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.title} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {info ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}