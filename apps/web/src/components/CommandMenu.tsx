'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Calculator,
  BarChart3,
  Bell,
  BookOpen,
  FileText,
  Search,
  ExternalLink,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  external?: boolean;
  section: 'Navegação' | 'Ações' | 'Calculadoras';
}

const COMMANDS: CommandItem[] = [
  // Navegação
  { id: 'go-dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'Navegação' },
  { id: 'go-portfolio', label: 'Portfólio', href: '/portfolio', icon: Wallet, section: 'Navegação' },
  { id: 'go-strategy', label: 'Estratégia (Permanent Portfolio)', href: '/portfolio/strategy', icon: TrendingUp, section: 'Navegação' },
  { id: 'go-simulator', label: 'Simulador', href: '/simulator', icon: BarChart3, section: 'Navegação' },
  { id: 'go-calculators', label: 'Calculadoras', href: '/calculators', icon: Calculator, section: 'Navegação' },
  { id: 'go-robos', label: 'Robo-advisors', href: '/calculators/robos', icon: Calculator, section: 'Navegação' },
  { id: 'go-explorer', label: 'Explorador FIIs', href: '/explorer', icon: Search, section: 'Navegação' },
  { id: 'go-alerts', label: 'Alertas 24/7', href: '/alerts', icon: Bell, section: 'Navegação' },
  { id: 'go-roadmap', label: 'Roadmap Educacional', href: '/roadmap', icon: BookOpen, section: 'Navegação' },
  { id: 'go-ir-helper', label: 'Auxiliar de IR', href: '/ir-helper', icon: FileText, section: 'Navegação' },

  // Ações
  { id: 'open-brapi', label: 'Brapi (dados de mercado)', href: 'https://brapi.dev', icon: ExternalLink, section: 'Ações', external: true },
  { id: 'open-finance', label: 'Status Invest', href: 'https://statusinvest.com.br', icon: ExternalLink, section: 'Ações', external: true },
  { id: 'open-funds', label: 'Funds Explorer', href: 'https://fundsexplorer.com.br', icon: ExternalLink, section: 'Ações', external: true },
];

/**
 * Command palette (Cmd+K / Ctrl+K) com busca fuzzy.
 * Ações: navegar, abrir link externo.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleSelect(id: string) {
    const item = COMMANDS.find((c) => c.id === id);
    if (!item) return;
    setOpen(false);
    if (item.external) {
      window.open(item.href, '_blank', 'noopener');
    } else if (item.href) {
      router.push(item.href);
    }
  }

  const grouped = COMMANDS.reduce(
    (acc, c) => {
      (acc[c.section] = acc[c.section] || []).push(c);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50"
    >
      <div className="flex items-center border-b border-white/10 px-3">
        <Search className="h-4 w-4 text-gray-400 mr-2" />
        <Command.Input
          placeholder="Buscar páginas, calculadoras, sites..."
          className="flex-1 bg-transparent text-white py-3 outline-none placeholder:text-gray-500"
        />
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/5 px-1.5 font-mono text-xs text-gray-400">
          ESC
        </kbd>
      </div>
      <Command.List className="max-h-96 overflow-y-auto p-2">
        <Command.Empty className="py-6 text-center text-sm text-gray-500">
          Nenhum resultado encontrado.
        </Command.Empty>
        {Object.entries(grouped).map(([section, items]) => (
          <Command.Group key={section} heading={section} className="text-xs">
            <div className="px-2 py-1 text-xs font-semibold text-gray-500">{section}</div>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={() => handleSelect(item.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-200 cursor-pointer hover:bg-white/5 aria-selected:bg-brand-purple/30 aria-selected:text-white"
                >
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span>{item.label}</span>
                  {item.external && (
                    <ExternalLink className="h-3 w-3 text-gray-500 ml-auto" />
                  )}
                </Command.Item>
              );
            })}
          </Command.Group>
        ))}
      </Command.List>
      <div className="border-t border-white/10 px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
        <span>Kapimind</span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded mr-1">↑↓</kbd>
          navegar
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded ml-2 mr-1">↵</kbd>
          selecionar
        </span>
      </div>
    </Command.Dialog>
  );
}
