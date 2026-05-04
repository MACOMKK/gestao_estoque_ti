import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Search, User, Monitor, CheckCircle2, Clock, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getCategoryLabel } from '@/components/assets/AssetStatusBadge';
import { generateTermoPDF } from '@/lib/generateTermoPDF';

export default function Terms() {
  const [search, setSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [sendingEmailFor, setSendingEmailFor] = useState('');

  const { data: employees = [], isLoading: loadingEmp } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date'),
  });

  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date'),
  });

  // Group assets by employee
  const employeesWithAssets = employees
    .filter(emp => emp.status === 'ativo')
    .map(emp => ({
      ...emp,
      assets: assets.filter(a => a.assigned_to === emp.full_name),
    }))
    .filter(emp => emp.assets.length > 0);

  const filtered = employeesWithAssets.filter(emp => {
    if (selectedEmployeeId && selectedEmployeeId !== 'all' && emp.id !== selectedEmployeeId) return false;
    if (search && !emp.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const queryClient = useQueryClient();

  const handleGeneratePDF = async (emp) => {
    await generateTermoPDF(emp, emp.assets);
  };

  const blobToBase64 = async (blob) => {
    const arrBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrBuffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };

  const handleSendEmail = async (emp) => {
    if (!emp.email) {
      window.alert('Colaborador sem email cadastrado.');
      return;
    }

    setSendingEmailFor(emp.id);
    try {
      const { blob, filename } = await generateTermoPDF(emp, emp.assets, { returnBlob: true });
      const pdf_base64 = await blobToBase64(blob);
      const dataAtual = new Date().toLocaleDateString('pt-BR');

      const bodyHtml = `
        <div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#111827;">
          <div style="max-width:620px;margin:24px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="background:#c1121f;padding:16px 20px;">
              <p style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.18em;line-height:1;">MACOM</p>
            </div>
            <div style="padding:24px 20px;">
              <h2 style="margin:0 0 12px;font-size:20px;line-height:1.2;color:#111827;">Termo de Responsabilidade de Ativos de TI</h2>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;">Ol\u00e1 <strong>${emp.full_name}</strong>,</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;">Segue em anexo o seu termo de responsabilidade referente aos equipamentos de TI vinculados ao seu nome.</p>
              <div style="margin:18px 0;padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;">
                <p style="margin:0;font-size:13px;color:#4b5563;"><strong>Colaborador:</strong> ${emp.full_name}</p>
                <p style="margin:6px 0 0;font-size:13px;color:#4b5563;"><strong>Data do envio:</strong> ${dataAtual}</p>
              </div>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">Em caso de d\u00favidas, entre em contato com o time de TI.</p>
            </div>
            <div style="padding:14px 20px;background:#111827;">
              <p style="margin:0;font-size:12px;color:#e5e7eb;">MACOM Mitsubishi Motors • Gest\u00e3o de Ativos de TI</p>
            </div>
          </div>
        </div>
      `;

      await base44.integrations.Functions.invoke('enviar-termo-gmail', {
        to: emp.email,
        subject: `Termo de Responsabilidade - ${emp.full_name}`,
        body_text: `Ol\u00e1 ${emp.full_name},\n\nSegue em anexo o seu termo de responsabilidade de equipamentos de TI.\n\nAtenciosamente,\nEquipe de TI`,
        body_html: bodyHtml,
        filename,
        pdf_base64
      });

      window.alert('Email enviado com sucesso.');
    } catch (error) {
      window.alert(error?.message || 'Falha ao enviar email.');
    } finally {
      setSendingEmailFor('');
    }
  };
const handleToggleAssinado = async (emp) => {
    const novoStatus = !emp.termo_assinado;
    await base44.entities.Employee.update(emp.id, {
      termo_assinado: novoStatus,
      termo_assinado_em: novoStatus ? new Date().toISOString().split('T')[0] : '',
    });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const isLoading = loadingEmp || loadingAssets;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Termos de Posse</h1>
        <p className="text-muted-foreground mt-1">Gere o PDF do termo de responsabilidade por colaborador</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar colaborador..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Todos os colaboradores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os colaboradores</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">Nenhum colaborador com equipamentos vinculados</p>
          <p className="text-sm text-muted-foreground mt-1">Vincule equipamentos a colaboradores na página de Ativos</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(emp => (
            <Card key={emp.id} className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${emp.termo_assinado ? 'border-emerald-300' : ''}`}>
              <div className="flex flex-col md:flex-row">
                {/* Employee info */}
                <div className={`p-5 md:w-72 md:border-r border-border ${emp.termo_assinado ? 'bg-emerald-50' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emp.termo_assinado ? 'bg-emerald-100' : 'bg-primary/10'}`}>
                      {emp.termo_assinado
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        : <User className="w-5 h-5 text-primary" />
                      }
                    </div>
                    <div>
                      <p className="font-bold text-sm">{emp.full_name}</p>
                      <p className="text-xs text-muted-foreground">{emp.department}</p>
                    </div>
                  </div>

                  {emp.termo_assinado ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 mb-3 gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Termo Assinado {emp.termo_assinado_em ? `em ${emp.termo_assinado_em}` : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 mb-3 gap-1">
                      <Clock className="w-3 h-3" /> Pendente
                    </Badge>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {emp.cpf && <p>CPF: {emp.cpf}</p>}
                    {emp.email && <p>{emp.email}</p>}
                    {emp.role && <p>Cargo: {emp.role}</p>}
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <Button onClick={() => handleGeneratePDF(emp)} className="w-full gap-2" size="sm">
                      <Download className="w-4 h-4" /> Gerar Termo PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      disabled={sendingEmailFor === emp.id}
                      onClick={() => handleSendEmail(emp)}
                    >
                      {sendingEmailFor === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Enviar por Email
                    </Button>
                    <Button
                      variant={emp.termo_assinado ? 'outline' : 'secondary'}
                      size="sm"
                      className={`w-full gap-2 ${emp.termo_assinado ? 'text-muted-foreground' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'}`}
                      onClick={() => handleToggleAssinado(emp)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {emp.termo_assinado ? 'Desmarcar Assinatura' : 'Marcar como Assinado'}
                    </Button>
                  </div>
                </div>

                {/* Assets */}
                <div className="flex-1 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {emp.assets.length} equipamento{emp.assets.length > 1 ? 's' : ''} vinculado{emp.assets.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {emp.assets.map(asset => (
                      <div key={asset.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                        <Monitor className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.tag} · {asset.serial_number || 'S/N'}</p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {getCategoryLabel(asset.category)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


