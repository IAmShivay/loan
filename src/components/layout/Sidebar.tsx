'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Users, 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Settings, 
  BarChart3,
  Calculator,
  User,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  // Admin Navigation
  {
    name: 'Overview',
    href: '/admin',
    icon: Home,
    roles: ['admin'],
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    name: 'DSA Management',
    href: '/admin/dsa',
    icon: Users,
    roles: ['admin'],
  },
  {
    name: 'Loan Applications',
    href: '/admin/applications',
    icon: FileText,
    roles: ['admin'],
  },
  {
    name: 'Support Tickets',
    href: '/admin/support',
    icon: HelpCircle,
    roles: ['admin'],
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['admin'],
  },

  // DSA Navigation
  {
    name: 'Dashboard',
    href: '/dsa',
    icon: Home,
    roles: ['dsa'],
  },
  {
    name: 'Applications Queue',
    href: '/dsa/applications',
    icon: FileText,
    roles: ['dsa'],
  },
  {
    name: 'Chat',
    href: '/dsa/chat',
    icon: MessageSquare,
    roles: ['dsa'],
  },
  {
    name: 'Support',
    href: '/dsa/support',
    icon: HelpCircle,
    roles: ['dsa'],
  },
  {
    name: 'Profile',
    href: '/dsa/profile',
    icon: User,
    roles: ['dsa'],
  },

  // User Navigation
  {
    name: 'Dashboard',
    href: '/user',
    icon: Home,
    roles: ['user'],
  },
  {
    name: 'My Applications',
    href: '/user/applications',
    icon: FileText,
    roles: ['user'],
  },
  {
    name: 'Loan Calculator',
    href: '/user/calculator',
    icon: Calculator,
    roles: ['user'],
  },
  {
    name: 'Chat',
    href: '/user/chat',
    icon: MessageSquare,
    roles: ['user'],
  },
  {
    name: 'Support',
    href: '/user/support',
    icon: HelpCircle,
    roles: ['user'],
  },
  {
    name: 'Profile',
    href: '/user/profile',
    icon: User,
    roles: ['user'],
  },
];

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    // Precise active state detection to prevent multiple active tabs
    const isActive = (() => {
      // Exact match
      if (pathname === item.href) return true;

      // For nested routes, check if current path starts with item href + '/'
      // but exclude root paths to prevent conflicts
      if (item.href !== '/' && item.href !== '/admin' && item.href !== '/dsa' && item.href !== '/user') {
        return pathname.startsWith(item.href + '/');
      }

      // For root dashboard paths, only match exactly
      return false;
    })();

    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div>
        <Link
          href={item.href}
          className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
            isActive
              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
              : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.name);
            } else {
              onClose();
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <item.icon className={cn(
              "h-5 w-5 transition-colors",
              isActive ? "text-blue-600" : "text-slate-500 group-hover:text-blue-600"
            )} />
            <span className="font-medium">{item.name}</span>
          </div>
          {hasChildren && (
            isExpanded ?
              <ChevronDown className="h-4 w-4 transition-transform" /> :
              <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </Link>
        
        {hasChildren && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children?.map((child) => (
              <NavItemComponent key={child.name} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out shadow-sm",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">LM</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-900">Loan Manager</span>
                <span className="text-xs text-slate-500">Management System</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden hover:bg-slate-100 p-2"
            >
              <X className="h-5 w-5 text-slate-600" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <NavItemComponent key={item.name} item={item} />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border bg-gradient-to-r from-primary/5 to-primary/10">
            <p className="text-xs text-muted-foreground text-center font-medium">
              © 2024 Loan Management System
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
