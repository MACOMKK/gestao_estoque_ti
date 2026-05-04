import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  disponivel: { label: 'Disponível', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  em_uso: { label: 'Em Uso', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  manutencao: { label: 'Manutenção', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  descartado: { label: 'Descartado', className: 'bg-red-100 text-red-800 border-red-200' },
};

const categoryLabels = {
  notebook: 'Notebook', monitor: 'Monitor', tv: 'TV', desktop: 'Desktop',
  impressora: 'Impressora', telefone: 'Telefone', headset: 'Headset',
  teclado: 'Teclado', mouse: 'Mouse', nobreak: 'Nobreak', switch: 'Switch',
  roteador: 'Roteador', servidor: 'Servidor', tablet: 'Tablet', outros: 'Outros',
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.disponivel;
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export function getCategoryLabel(category) {
  return categoryLabels[category] || category;
}