import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  Users,
  FileText,
  Building2,
  Globe,
  Phone,
  Package,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/unidades', label: 'Unidades', icon: Building2 },
  { path: '/ativos', label: 'Ativos', icon: Monitor },
  { path: '/colaboradores', label: 'Colaboradores', icon: Users },
  { path: '/termos', label: 'Termos de Posse', icon: FileText },
  { path: '/infraestrutura', label: 'Infraestrutura', icon: Globe },
  { path: '/fornecedores', label: 'Fornecedores', icon: Package },
  { path: '/chips', label: 'Chips Corporativos', icon: Phone },
  { path: '/conhecimento', label: 'Base de Conhecimento', icon: BookOpen }
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, theme, toggleTheme }) {
  const location = useLocation();
  const { logout } = useAuth();
  const logoUrl = 'https://res.cloudinary.com/drevbr5eq/image/upload/q_auto/f_auto/v1777603989/logo_vermelha_e2aob2.png';

  const handleLogout = async () => {
    await logout(false);
    window.location.href = '/login';
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`
        fixed top-0 left-0 h-full bg-card border-r border-border z-50
        transition-all duration-300 ease-in-out flex flex-col
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="MACOM" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="font-extrabold text-foreground text-base tracking-tight leading-none">MACOM</h1>
                <p className="text-[10px] text-muted-foreground font-medium tracking-wider">GESTAO DE ATIVOS</p>
              </div>
            </div>
          )}
          {collapsed && <img src={logoUrl} alt="MACOM" className="w-8 h-8 object-contain mx-auto" />}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-7 w-7"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className={`w-full gap-2 ${collapsed ? 'px-0 justify-center' : ''}`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!collapsed && <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className={`w-full gap-2 ${collapsed ? 'px-0 justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sair</span>}
          </Button>
          {!collapsed && (
            <p className="text-[10px] text-muted-foreground text-center">MACOM Mitsubishi © {new Date().getFullYear()}</p>
          )}
        </div>
      </aside>
    </>
  );
}

