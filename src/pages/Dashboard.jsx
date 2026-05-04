import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Monitor, Users, CheckCircle, AlertTriangle, Wrench, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import StatsCard from '@/components/dashboard/StatsCard';
import { StatusBadge, getCategoryLabel } from '@/components/assets/AssetStatusBadge';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

export default function Dashboard() {
  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const stats = {
    total: assets.length,
    disponivel: assets.filter(a => a.status === 'disponivel').length,
    em_uso: assets.filter(a => a.status === 'em_uso').length,
    manutencao: assets.filter(a => a.status === 'manutencao').length,
    descartado: assets.filter(a => a.status === 'descartado').length,
    employees: employees.filter(e => e.status === 'ativo').length,
  };

  const statusData = [
    { name: 'Disponível', value: stats.disponivel },
    { name: 'Em Uso', value: stats.em_uso },
    { name: 'Manutenção', value: stats.manutencao },
    { name: 'Descartado', value: stats.descartado },
  ].filter(d => d.value > 0);

  const categoryData = Object.entries(
    assets.reduce((acc, a) => {
      const label = getCategoryLabel(a.category);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const recentAssets = assets.slice(0, 5);

  if (loadingAssets) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral dos ativos de TI da MACOM</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total de Ativos" value={stats.total} icon={Monitor} color="bg-primary" />
        <StatsCard title="Disponíveis" value={stats.disponivel} icon={CheckCircle} color="bg-emerald-500" />
        <StatsCard title="Em Uso" value={stats.em_uso} icon={Users} color="bg-blue-500" />
        <StatsCard title="Manutenção" value={stats.manutencao} icon={Wrench} color="bg-amber-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Status dos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-16 text-sm">Nenhum ativo cadastrado</p>
            )}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {statusData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span>{item.name}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ativos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(0, 90%, 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-16 text-sm">Nenhum ativo cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Últimos Ativos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAssets.length > 0 ? (
            <div className="divide-y divide-border">
              {recentAssets.map(asset => (
                <div key={asset.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{asset.tag} · {getCategoryLabel(asset.category)}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <StatusBadge status={asset.status} />
                    {asset.assigned_to && <span className="text-xs text-muted-foreground hidden sm:inline">{asset.assigned_to}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8 text-sm">Nenhum ativo cadastrado ainda</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}