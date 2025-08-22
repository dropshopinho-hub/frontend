import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Settings, Users, Package, ArrowRightLeft, RotateCcw, FileText } from 'lucide-react';

const Layout = ({ children, currentPage, setCurrentPage }) => {
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
  { id: 'dashboard-tools-status', label: 'Dashboard de Status', icon: FileText, adminOnly: false },
    { id: 'tools', label: 'Ferramentas', icon: Package, adminOnly: true },
    { id: 'assignments', label: 'Atribuições', icon: Users, adminOnly: true },
  // { id: 'rejected-assignments', label: 'Atribuições Recusadas', icon: FileText, adminOnly: true },
    { id: 'my-tools', label: 'Minhas Ferramentas', icon: Settings, adminOnly: false },
    { id: 'transfers', label: 'Transferências', icon: ArrowRightLeft, adminOnly: false },
    { id: 'returns', label: 'Devoluções', icon: RotateCcw, adminOnly: false },
  // { id: 'reports', label: 'Relatórios', icon: FileText, adminOnly: true },
    { id: 'user-register', label: 'Cadastrar Usuário', icon: Users, adminOnly: true },
    { id: 'user-admin-list', label: 'Gerenciar Usuários', icon: Settings, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Gestão de Ferramentas
              </h1>
              <p className="text-sm text-gray-600">
                Bem-vindo, {user?.username} ({user?.role === 'admin' ? 'Administrador' : 'Usuário'})
              </p>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-none transition-colors ${
                          currentPage === item.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;

