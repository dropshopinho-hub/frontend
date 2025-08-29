import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Search } from 'lucide-react';

const ReportsPage = () => {
  const { token } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    user_name: ''
  });

  useEffect(() => {
    fetchReport();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reportData, filters]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (filters.name) queryParams.append('name', filters.name);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.user_name) queryParams.append('user_name', filters.user_name);

      const response = await apiFetch(`/api/reports/tools?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.report || []);
      } else {
        setError('Erro ao carregar relatório');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reportData];

    if (filters.name) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.user_name) {
      filtered = filtered.filter(item =>
        item.username && item.username.toLowerCase().includes(filters.user_name.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleDownloadPDF = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.name) queryParams.append('name', filters.name);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.user_name) queryParams.append('user_name', filters.user_name);

      const response = await apiFetch(`/api/reports/tools/pdf?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `relatorio_ferramentas_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Erro ao gerar PDF');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      status: '',
      user_name: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disponível':
        return 'text-green-600 bg-green-50';
      case 'Pendente de Confirmação':
        return 'text-yellow-600 bg-yellow-50';
      case 'Emprestado':
        return 'text-blue-600 bg-blue-50';
      case 'Em Devolução':
        return 'text-purple-600 bg-purple-50';
      case 'Aguardando Confirmação de Transferência':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const statusOptions = [
    'Disponível',
    'Pendente de Confirmação',
    'Emprestado',
    'Em Devolução',
    'Aguardando Confirmação de Transferência'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <Button onClick={handleDownloadPDF} disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Baixar PDF
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tool-name-filter">Nome da Ferramenta</Label>
              <Input
                id="tool-name-filter"
                placeholder="Filtrar por nome..."
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="user-name-filter">Nome do Usuário</Label>
              <Input
                id="user-name-filter"
                placeholder="Filtrar por usuário..."
                value={filters.user_name}
                onChange={(e) => setFilters({ ...filters, user_name: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={fetchReport}>
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Relatório de Ferramentas
            {filteredData.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredData.length} {filteredData.length === 1 ? 'item' : 'itens'})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
            {loading ? (
              <p className="text-center py-8">Carregando relatório...</p>
            ) : filteredData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {reportData.length === 0 ? 'Nenhum dado encontrado' : 'Nenhum item corresponde aos filtros aplicados'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Ferramenta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data de Atribuição</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>{item.username || '-'}</TableCell>
                      <TableCell>
                        {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {statusOptions.map((status) => {
                const count = filteredData.filter(item => item.status === status).length;
                const total = filteredData.filter(item => item.status === status).reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <div key={status} className="text-center">
                    <div className={`px-3 py-2 rounded-lg ${getStatusColor(status)}`}>
                      <div className="font-bold text-lg">{total}</div>
                      <div className="text-xs">{status}</div>
                      <div className="text-xs opacity-75">({count} {count === 1 ? 'registro' : 'registros'})</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
