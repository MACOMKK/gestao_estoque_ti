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
  type: '', title: '', value: '', description: '',
  contact_name: '', contact_email: '', contact_phone: '',
  unit_id: '', unit_name: '',
};

const typePlaceholders = {
  ip: 'ex: 192.168.1.1',
  sistema: 'ex: https://sistema.empresa.com.br',
  fornecedor: 'ex: (91) 99999-9999',
  chip_corporativo: 'ex: (91) 99999-9999 / número do chip',
};

export default function InfoFormDialog({ open, onOpenChange, info, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.filter({ status: 'ativa' }),
    enabled: open,
  });

  useEffect(() => {
    if (info) {
      setForm({
        type: info.type || '',
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

  const showContactFields = ['fornecedor', 'chip_corporativo'].includes(form.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">
            {info ? 'Editar Registro' : 'Novo Registro'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={v => update('type', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ip">IP</SelectItem>
                  <SelectItem value="sistema">Link de Sistema</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="chip_corporativo">Chip Corporativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Título / Nome *</Label>
              <Input required value={form.title} onChange={e => update('title', e.target.value)} placeholder="ex: Servidor Principal" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>{form.type === 'sistema' ? 'URL do Sistema' : form.type === 'ip' ? 'Endereço IP' : 'Telefone / Número'}</Label>
              <Input value={form.value} onChange={e => update('value', e.target.value)} placeholder={typePlaceholders[form.type] || 'Valor'} />
            </div>

            {showContactFields && (
              <>
                <div className="space-y-1.5">
                  <Label>Nome do Contato</Label>
                  <Input value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Nome do responsável" />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone do Contato</Label>
                  <Input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} placeholder="(91) 99999-9999" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label>E-mail do Contato</Label>
                  <Input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="email@empresa.com" />
                </div>
              </>
            )}

            <div className="md:col-span-2 space-y-1.5">
              <Label>Unidade / Filial</Label>
              <Select value={form.unit_id} onValueChange={handleUnitChange}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} placeholder="Informações adicionais..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.type || !form.title} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {info ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}