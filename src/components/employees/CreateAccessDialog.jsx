import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CreateAccessDialog({ open, onOpenChange, employee }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perfil, setPerfil] = useState('user');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(employee?.email || '');
    setPassword('');
    setPerfil('user');
  }, [open, employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.integrations.Functions.invoke('admin-create-user', {
        email: email.trim(),
        password,
        perfil,
        colaborador_id: employee?.id || null
      });
      window.alert('Acesso criado com sucesso.');
      onOpenChange(false);
    } catch (error) {
      window.alert(error?.message || 'Falha ao criar acesso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">Criar Acesso ao Sistema</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Colaborador</Label>
            <Input value={employee?.full_name || ''} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Senha temporaria *</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <Select value={perfil} onValueChange={setPerfil}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Criar Acesso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

