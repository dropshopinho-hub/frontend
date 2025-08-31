import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, User, Package, Search, Filter, ChevronUp, ChevronDown, Square, CheckSquare } from 'lucide-react';

const ReturnReceiptPage = () => {
  const [pendingReturns, setPendingReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [toolFilter, setToolFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const { user, token } = useAuth();

  const apiFetch = async (url, options = {}) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    return response;
  };

  const fetchPendingReturns = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching pending returns...');
      console.log('User:', user);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await apiFetch('/api/returns/pending');
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Pending returns data:', data);
        setPendingReturns(data);
        setFilteredReturns(data);
      } else {
        console.log('Error response:', response);
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          setError(errorData.error || 'Erro ao carregar devoluções pendentes');
        } catch (parseError) {
          console.log('Could not parse error response as JSON');
          setError(`Erro ${response.status}: ${response.statusText}`);
        }
      }
    } catch (err) {
      console.error('Error fetching pending returns:', err);
      setError('Erro de conexão ao carregar devoluções pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (toolInstanceId, toolName, showMessages = true) => {
    try {
      if (showMessages) {
        setError('');
        setSuccess('');
      }
      
      const response = await apiFetch(`/api/returns/approve/${toolInstanceId}`, {
        method: 'POST'
      });

      if (response.ok) {
        if (showMessages) {
          setSuccess(`Devolução da ferramenta "${toolName}" aprovada com sucesso!`);
          await fetchPendingReturns(); // Recarrega a lista
        }
        return true;
      } else {
        const errorData = await response.json();
        if (showMessages) {
          setError(errorData.error || 'Erro ao aprovar devolução');
        }
        return false;
      }
    } catch (err) {
      console.error('Error approving return:', err);
      if (showMessages) {
        setError('Erro de conexão ao aprovar devolução');
      }
      return false;
    }
  };

  const handleReject = async (toolInstanceId, toolName, showMessages = true) => {
    try {
      if (showMessages) {
        setError('');
        setSuccess('');
      }
      
      const response = await apiFetch(`/api/returns/reject/${toolInstanceId}`, {
        method: 'POST'
      });

      if (response.ok) {
        if (showMessages) {
          setSuccess(`Devolução da ferramenta "${toolName}" rejeitada. Ferramenta retornada ao usuário.`);
          await fetchPendingReturns(); // Recarrega a lista
        }
        return true;
      } else {
        const errorData = await response.json();
        if (showMessages) {
          setError(errorData.error || 'Erro ao rejeitar devolução');
        }
        return false;
      }
    } catch (err) {
      console.error('Error rejecting return:', err);
      if (showMessages) {
        setError('Erro de conexão ao rejeitar devolução');
      }
      return false;
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchPendingReturns();
    }
  }, [user, token]);

  // Filtros e ordenação
  useEffect(() => {
    let filtered = [...pendingReturns];

    // Filtro por busca textual
    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.tool_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.user_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por usuário
    if (userFilter && userFilter !== 'todos') {
      filtered = filtered.filter(item => item.user_name === userFilter);
    }

    // Filtro por ferramenta
    if (toolFilter && toolFilter !== 'todas') {
      filtered = filtered.filter(item => item.tool_name === toolFilter);
    }

    // Filtro por data
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(item => {
        if (!item.assigned_at) return false;
        const itemDate = new Date(item.assigned_at);
        return itemDate.toDateString() === filterDate.toDateString();
      });
    }

    // Aplicar ordenação
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle null/undefined values
        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;
        if (!bValue) return -1;
        
        // Handle dates
        if (sortConfig.key === 'assigned_at') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        
        // Handle strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredReturns(filtered);
  }, [pendingReturns, searchTerm, userFilter, toolFilter, dateFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setUserFilter('');
    setToolFilter('');
    setDateFilter('');
    setSortConfig({ key: null, direction: 'asc' });
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredReturns.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredReturns.map(item => item.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos uma ferramenta');
      return;
    }

    setError('');
    setSuccess('');
    
    try {
      const promises = selectedItems.map(itemId => {
        const item = filteredReturns.find(r => r.id === itemId);
        if (action === 'approve') {
          return handleApprove(itemId, item?.tool_name, false);
        } else {
          return handleReject(itemId, item?.tool_name, false);
        }
      });

      await Promise.all(promises);
      
      const actionText = action === 'approve' ? 'aprovadas' : 'rejeitadas';
      setSuccess(`${selectedItems.length} devolução(ões) ${actionText} com sucesso!`);
      setSelectedItems([]);
      setBulkAction('');
      await fetchPendingReturns();
    } catch (err) {
      setError('Erro ao processar ações em lote');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-lg">Carregando devoluções pendentes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Recebimento de Devoluções
        </h1>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {filteredReturns.length} de {pendingReturns.length} pendente(s)
          </Badge>
          {selectedItems.length > 0 && (
            <Badge variant="outline" className="text-lg px-3 py-1 bg-blue-50 text-blue-700">
              {selectedItems.length} selecionada(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Busca Textual */}
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Ferramenta ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Usuário */}
            <div>
              <Label htmlFor="user-filter">Usuário</Label>
              <select
                id="user-filter"
                className="w-full border rounded-md px-3 py-2 bg-white"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="">Todos os usuários</option>
                <option value="todos">Todos</option>
                {[...new Set(pendingReturns.map(item => item.user_name).filter(Boolean))].map(userName => (
                  <option key={userName} value={userName}>{userName}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Ferramenta */}
            <div>
              <Label htmlFor="tool-filter">Ferramenta</Label>
              <select
                id="tool-filter"
                className="w-full border rounded-md px-3 py-2 bg-white"
                value={toolFilter}
                onChange={(e) => setToolFilter(e.target.value)}
              >
                <option value="">Todas as ferramentas</option>
                <option value="todas">Todas</option>
                {[...new Set(pendingReturns.map(item => item.tool_name).filter(Boolean))].map(toolName => (
                  <option key={toolName} value={toolName}>{toolName}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Data */}
            <div>
              <Label htmlFor="date-filter">Data de Solicitação</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {selectedItems.length > 0 && (
                <>
                  <Button
                    onClick={() => handleBulkAction('approve')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar Selecionadas ({selectedItems.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBulkAction('reject')}
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar Selecionadas ({selectedItems.length})
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {filteredReturns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {pendingReturns.length === 0 ? 'Nenhuma devolução pendente' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-500 text-center">
              {pendingReturns.length === 0 
                ? 'Todas as devoluções foram processadas ou não há solicitações no momento.'
                : 'Tente ajustar os filtros para encontrar devoluções pendentes.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Cabeçalho da Tabela com Ordenação */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-medium text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
                >
                  {selectedItems.length === filteredReturns.length && filteredReturns.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                  Selecionar
                </button>
              </div>
              <div 
                className="cursor-pointer hover:bg-gray-100 p-2 rounded flex items-center justify-between"
                onClick={() => handleSort('tool_name')}
              >
                Ferramenta
                {getSortIcon('tool_name')}
              </div>
              <div 
                className="cursor-pointer hover:bg-gray-100 p-2 rounded flex items-center justify-between"
                onClick={() => handleSort('user_name')}
              >
                Usuário
                {getSortIcon('user_name')}
              </div>
              <div 
                className="cursor-pointer hover:bg-gray-100 p-2 rounded flex items-center justify-between"
                onClick={() => handleSort('assigned_at')}
              >
                Data da Solicitação
                {getSortIcon('assigned_at')}
              </div>
              <div className="text-center">Ações</div>
            </div>
          </div>

          {/* Lista de Devoluções */}
          {filteredReturns.map((item) => (
            <Card 
              key={item.id} 
              className={`border-l-4 border-l-yellow-400 ${
                selectedItems.includes(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span>{item.tool_name || 'Ferramenta não identificada'}</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectItem(item.id)}
                      className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
                    >
                      {selectedItems.includes(item.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{item.tool_name || 'Ferramenta não identificada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{item.user_name || 'Usuário não identificado'}</span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(item.id, item.tool_name)}
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Recusar
                    </Button>
                    <Button
                      onClick={() => handleApprove(item.id, item.tool_name)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aceitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


export default ReturnReceiptPage;
// Manual edit to trigger GitHub Desktop detection - 30/08/2025
