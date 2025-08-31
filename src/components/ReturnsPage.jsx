import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, CheckSquare, Square } from 'lucide-react';

const ReturnsPage = () => {
  const { token, user } = useAuth();
  const [borrowedTools, setBorrowedTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);
  const [toolQuantities, setToolQuantities] = useState({});

  useEffect(() => {
    if (user && token) {
      fetchBorrowedTools();
    }
  }, [user, token]);

  const fetchBorrowedTools = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiFetch(`/api/assignments/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Returns page - borrowed tools data:', data);
        const tools = data.confirmed || [];
        setBorrowedTools(tools);
        // Inicializar quantidades com o valor atual de cada ferramenta
        const initialQuantities = {};
        tools.forEach(tool => {
          initialQuantities[tool.id] = tool.quantity;
        });
        setToolQuantities(initialQuantities);
      } else {
        setError('Erro ao carregar ferramentas emprestadas');
      }
    } catch (error) {
      setError('Erro de conexão');
      console.error('Error fetching borrowed tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (toolInstance) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await apiFetch(`/api/returns/tools/return/${toolInstance.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess(`Ferramenta ${toolInstance.name} devolvida com sucesso!`);
        fetchBorrowedTools(); // Recarrega a lista
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao devolver ferramenta');
      }
    } catch (error) {
      setError('Erro de conexão');
      console.error('Error returning tool:', error);
    }
  };

  const handleSelectTool = (toolId) => {
    setSelectedTools(prev => {
      if (prev.includes(toolId)) {
        return prev.filter(id => id !== toolId);
      } else {
        return [...prev, toolId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTools.length === borrowedTools.length) {
      setSelectedTools([]);
    } else {
      setSelectedTools(borrowedTools.map(tool => tool.id));
    }
  };

  const updateToolQuantity = (toolId, quantity) => {
    setToolQuantities(prev => ({
      ...prev,
      [toolId]: parseInt(quantity) || 1
    }));
  };

  const handleMultipleReturns = async () => {
    if (selectedTools.length === 0) {
      setError('Selecione pelo menos uma ferramenta para devolver');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const results = [];
      
      for (const toolId of selectedTools) {
        try {
          const response = await apiFetch(`/api/returns/tools/return/${toolId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const tool = borrowedTools.find(t => t.id === toolId);
          if (response.ok) {
            results.push({ success: true, tool: tool?.name || 'Ferramenta' });
          } else {
            const errorData = await response.json();
            results.push({ success: false, tool: tool?.name || 'Ferramenta', error: errorData.error });
          }
        } catch (err) {
          const tool = borrowedTools.find(t => t.id === toolId);
          results.push({ success: false, tool: tool?.name || 'Ferramenta', error: 'Erro de conexão' });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failedResults = results.filter(r => !r.success);
      
      if (failedResults.length === 0) {
        setSelectedTools([]);
        setSuccess(`${successCount} ferramenta(s) devolvida(s) com sucesso!`);
        fetchBorrowedTools();
      } else {
        const errorMessages = failedResults.map(r => `${r.tool}: ${r.error}`).join('; ');
        setError(`${failedResults.length} devolução(ões) falharam: ${errorMessages}`);
        if (successCount > 0) {
          setSuccess(`${successCount} ferramenta(s) devolvida(s) com sucesso!`);
          fetchBorrowedTools();
        }
      }
    } catch (error) {
      setError('Erro geral ao processar devoluções');
      console.error('Error in multiple returns:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Devoluções
            </div>
            <div className="flex items-center gap-4">
              {selectedTools.length > 0 && (
                <Badge variant="outline" className="text-lg px-3 py-1 bg-blue-50 text-blue-700">
                  {selectedTools.length} selecionada(s)
                </Badge>
              )}
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {borrowedTools.length} ferramenta(s) emprestada(s)
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Botões de Ação */}
          {borrowedTools.length > 0 && (
            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  {selectedTools.length === borrowedTools.length && borrowedTools.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                  {selectedTools.length === borrowedTools.length && borrowedTools.length > 0 ? 'Desselecionar Tudo' : 'Selecionar Tudo'}
                </Button>
              </div>
              {selectedTools.length > 0 && (
                <Button
                  onClick={handleMultipleReturns}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Devolver Selecionadas ({selectedTools.length})
                </Button>
              )}
            </div>
          )}

          {borrowedTools.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Você não possui ferramentas emprestadas para devolver</p>
            </div>
          ) : (
            <div className="space-y-4">
              {borrowedTools.map((tool) => (
                <Card key={tool.id} className={`border-l-4 border-l-blue-400 ${
                  selectedTools.includes(tool.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Primeira linha: Nome da ferramenta e seleção */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedTools.includes(tool.id)}
                            onCheckedChange={() => handleSelectTool(tool.id)}
                          />
                          <div>
                            <span className="font-medium text-lg">{tool.name || 'Ferramenta não identificada'}</span>
                            <div className="text-sm text-gray-500">
                              Data de Confirmação: {tool.assigned_at ? new Date(tool.assigned_at).toLocaleDateString('pt-BR') : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {tool.status || 'Emprestado'}
                        </Badge>
                      </div>
                      
                      {/* Segunda linha: Quantidade e ações */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Label htmlFor={`qty-${tool.id}`} className="text-sm font-medium">Quantidade:</Label>
                          <Input
                            id={`qty-${tool.id}`}
                            type="number"
                            min="1"
                            max={tool.quantity}
                            value={toolQuantities[tool.id] || tool.quantity}
                            onChange={(e) => updateToolQuantity(tool.id, e.target.value)}
                            className="w-24 h-12 text-center text-lg font-bold border-2 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white rounded-md"
                          />
                          <span className="text-sm text-gray-500">de {tool.quantity}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleReturn(tool)}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Devolver Individual
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona a Devolução</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Esta página mostra todas as ferramentas que você possui emprestadas</p>
            <p>2. Clique no botão "Devolver" para retornar uma ferramenta</p>
            <p>3. A ferramenta ficará disponível novamente para outros usuários</p>
            <p>4. O histórico da devolução será registrado no sistema</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReturnsPage;
