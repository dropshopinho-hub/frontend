import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

const ToolsPage = () => {
  const { token, isAdmin } = useAuth();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tools', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
      }
    } catch (error) {
      // Trate erros conforme necessário
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool =>
    (tool.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    // Adicione outros filtros se necessário
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disponível':
        return 'text-green-600 bg-green-50';
      case 'Emprestado':
        return 'text-blue-600 bg-blue-50';
      case 'Recusada':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome da ferramenta..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
            {loading ? (
              <p className="text-center py-8">Carregando ferramentas...</p>
            ) : filteredTools.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma ferramenta encontrada
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Ferramenta</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name || '-'}</TableCell>
                      <TableCell>{tool.quantity}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tool.status)}`}>
                          {tool.status || 'Disponível'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );