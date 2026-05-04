import React from 'react';
import { Card } from '@/components/ui/card';

export default function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <Card className="p-5 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-6 translate-x-6 opacity-10 ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-extrabold mt-1 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`w-5 h-5 text-primary`} />
        </div>
      </div>
    </Card>
  );
}