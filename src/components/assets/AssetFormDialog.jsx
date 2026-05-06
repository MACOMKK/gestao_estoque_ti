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

const categories = [
  { value: 'notebook', label: 'Notebook' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'tv', label: 'TV' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'impressora', label: 'Impressora' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'headset', label: 'Headset' },
  { value: 'teclado', label: 'Teclado' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'nobreak', label: 'Nobreak' },
  { value: 'switch', label: 'Switch' },
  { value: 'roteador', label: 'Roteador' },
  { value: 'servidor', label: 'Servidor' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'outros', label: 'Outros' },
];

const statuses = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'em_uso', label: 'Em Uso' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'descartado', label: 'Descartado' },
];

const conditions = [
  { value: 'novo', label: 'Novo' },
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim', label: 'Ruim' },
];

const emptyForm = {
  tag: '', name: '', category: '', brand: '', model: '',
  serial_number: '', status: 'disponivel', condition: 'novo',
  purchase_date: '', purchase_value: '', location: '', notes: '',
  unit_id: '', unit_name: '',
};

export default function AssetFormDialog({ open, onOpenChange, asset, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.filter({ status: 'ativa' }),
    enabled: open,
  });

  useEffect(() => {
    if (asset) {
      setForm({
        tag: asset.tag || '',
        name: asset.name || '',
        category: asset.category || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serial_number: asset.serial_number || '',
        status: asset.status || 'disponivel',
        condition: asset.condition || 'novo',
        purchase_date: asset.purchase_date || '',
        purchase_value: asset.purchase_value || '',
        location: asset.location || '',
        notes: asset.notes || '',
        unit_id: asset.unit_id || '',
        unit_name: asset.unit_name || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [asset, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, purchase_value: form.purchase_value ? Number(form.purchase_value) : undefined };
      if (asset) {
        await base44.entities.Asset.update(asset.id, data);
      } else {
        await base44.entities.Asset.create(data);
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      window.alert(error?.message || 'Falha ao salvar ativo.');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">
            {asset ? 'Editar Ativo' : 'Novo Ativo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Código Patrimonial</Label>
              <Input value={form.tag} onChange={e => update('tag', e.target.value)} placeholder="ex: MAC-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Nome do Equipamento *</Label>
              <Input required value={form.name} onChange={e => update('name', e.target.value)} placeholder="ex: Notebook Dell Latitude" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input value={form.brand} onChange={e => update('brand', e.target.value)} placeholder="ex: Dell" />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Input value={form.model} onChange={e => update('model', e.target.value)} placeholder="ex: Latitude 5520" />
            </div>
            <div className="space-y-1.5">
              <Label>Nº de Série</Label>
              <Input value={form.serial_number} onChange={e => update('serial_number', e.target.value)} placeholder="Número de série" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conservação</Label>
              <Select value={form.condition} onValueChange={v => update('condition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {conditions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data de Aquisição</Label>
              <Input type="date" value={form.purchase_date} onChange={e => update('purchase_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.purchase_value} onChange={e => update('purchase_value', e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade / Filial</Label>
              <Select value={form.unit_id} onValueChange={handleUnitChange}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Localização Interna</Label>
              <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="ex: Sala TI - 2º andar" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {asset ? 'Salvar Alterações' : 'Cadastrar Ativo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
