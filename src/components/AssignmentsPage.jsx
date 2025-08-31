import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Eye } from 'lucide-react';

const AssignmentsPage = () => {
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { token, isAdmin } = useAuth();

  useEffect(() => {
  }, [isAdmin]);

  // ...token e isAdmin já declarados acima...
  const [availableTools, setAvailableTools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toolSearchTerm, setToolSearchTerm] = useState('');
  const [selectedTools, setSelectedTools] = useState([]); // Array de ferramentas selecionadas
  const [targetUserId, setTargetUserId] = useState(''); // Usuário destino único
  const [showPreview, setShowPreview] = useState(false); // Preview das atribuições

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch available tools
      const toolsResponse = await apiFetch('/api/tools/instances', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json();
        // Filter only available tools
        const available = toolsData.tools.filter(tool => tool.status === 'Disponível');
        setAvailableTools(available);
      }

      // Fetch users
      const usersResponse = await apiFetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users data in AssignmentsPage:', usersData);
        setUsers(usersData || []);
      }
    } catch (error) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar ferramenta à seleção
  const addToolToSelection = (tool) => {
    if (!selectedTools.find(t => t.tool_id === tool.tool_id)) {
      setSelectedTools([...selectedTools, {
        tool_id: tool.tool_id,
        tool_name: tool.tool_name,
        available_quantity: tool.available_quantity,
        selected_quantity: 1
      }]);
    }
  };

  // Remover ferramenta da seleção
  const removeToolFromSelection = (toolId) => {
    setSelectedTools(selectedTools.filter(t => t.tool_id !== toolId));
  };

  // Atualizar quantidade selecionada
  const updateSelectedQuantity = (toolId, quantity) => {
    setSelectedTools(selectedTools.map(t => 
      t.tool_id === toolId ? { ...t, selected_quantity: parseInt(quantity) } : t
    ));
  };

  // Processar atribuições múltiplas
  const handleMultipleAssignments = async () => {
    setError('');
    
    if (selectedTools.length === 0) {
      setError('Selecione pelo menos uma ferramenta');
      return;
    }
    
    if (!targetUserId) {
      setError('Selecione um usuário');
      return;
    }

    try {
      // Enviar cada atribuição individualmente com tratamento de erro melhorado
      const results = [];
      
      for (const tool of selectedTools) {
        try {
          const response = await apiFetch('/api/assignments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              tool_id: tool.tool_id,
              user_id: targetUserId,
              quantity: tool.selected_quantity
            })
          });

          if (response.ok) {
            results.push({ success: true, tool: tool.tool_name });
          } else {
            const errorData = await response.json();
            results.push({ success: false, tool: tool.tool_name, error: errorData.error });
          }
        } catch (err) {
          results.push({ success: false, tool: tool.tool_name, error: 'Erro de conexão' });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failedResults = results.filter(r => !r.success);
      
      if (failedResults.length === 0) {
        setSelectedTools([]);
        setTargetUserId('');
        setIsDialogOpen(false);
        setShowPreview(false);
        setSuccessMessage(`${successCount} ferramenta(s) atribuída(s) com sucesso!`);
        fetchData();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const errorMessages = failedResults.map(r => `${r.tool}: ${r.error}`).join('; ');
        setError(`${failedResults.length} atribuição(ões) falharam: ${errorMessages}`);
      }
    } catch (error) {
      setError('Erro de conexão geral');
    }
  };

  // Group available tools by name
  const groupedTools = availableTools.reduce((acc, tool) => {
    const key = `${tool.tool_name}_${tool.tool_id}`;
    if (!acc[key]) {
      acc[key] = {
        tool_id: tool.tool_id,
        tool_name: tool.tool_name,
        available_quantity: 0
      };
    }
    acc[key].available_quantity += tool.quantity;
    return acc;
  }, {});

  // Filter tools based on search term
  const filteredToolOptions = Object.values(groupedTools).filter(tool =>
    tool.tool_name.toLowerCase().includes(toolSearchTerm.toLowerCase())
  );

  // Verificar se ferramenta já está selecionada
  const isToolSelected = (toolId) => {
    return selectedTools.some(t => t.tool_id === toolId);
  };

  // Limpar seleções
  const clearSelections = () => {
    setSelectedTools([]);
    setTargetUserId('');
    setShowPreview(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  return (
  <div className="space-y-6">
    {showContactPopup && (
      <Dialog open={showContactPopup} onOpenChange={setShowContactPopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atenção</DialogTitle>
            <DialogDescription>Entre em contato com o Responsável para recusar a atribuição.</DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setShowContactPopup(false)}>Fechar</Button>
        </DialogContent>
      </Dialog>
    )}
    {successMessage && (
      <Alert variant="success">
        <AlertDescription>{successMessage}</AlertDescription>
      </Alert>
    )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Atribuições</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) clearSelections();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Atribuição Múltipla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Atribuir Ferramentas</DialogTitle>
              <DialogDescription>
                Selecione múltiplas ferramentas, defina quantidades e escolha o usuário
              </DialogDescription>
            </DialogHeader>
            
            {!showPreview ? (
              <div className="space-y-6">
                {/* Seleção de Usuário */}
                <div>
                  <Label htmlFor="user-select">Usuário Destino</Label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ferramentas Selecionadas */}
                {selectedTools.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Ferramentas Selecionadas ({selectedTools.length})
                        <Button variant="outline" size="sm" onClick={clearSelections}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Limpar Tudo
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedTools.map((tool) => (
                          <div key={tool.tool_id} className="grid grid-cols-12 gap-6 items-center p-4 border rounded hover:bg-gray-50">
                            <div className="col-span-7">
                              <span className="font-medium text-lg">{tool.tool_name}</span>
                              <div className="text-sm text-gray-500 mt-1">
                                Disponível: {tool.available_quantity} unidade(s)
                              </div>
                            </div>
                            <div className="col-span-3 flex items-center space-x-3">
                              <Label htmlFor={`qty-${tool.tool_id}`} className="text-sm whitespace-nowrap font-medium">Quantidade:</Label>
                              <Input
                                id={`qty-${tool.tool_id}`}
                                type="number"
                                min="1"
                                max={tool.available_quantity}
                                value={tool.selected_quantity}
                                onChange={(e) => updateSelectedQuantity(tool.tool_id, e.target.value)}
                                className="w-24 text-center"
                              />
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeToolFromSelection(tool.tool_id)}
                                className="w-full min-w-[100px]"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Busca e Lista de Ferramentas */}
                <div>
                  <Label htmlFor="tool-search">Pesquisar Ferramentas</Label>
                  <Input
                    id="tool-search"
                    placeholder="Digite o nome da ferramenta..."
                    value={toolSearchTerm}
                    onChange={(e) => setToolSearchTerm(e.target.value)}
                    className="mb-4"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Ferramentas Disponíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredToolOptions.map((tool) => (
                        <div key={tool.tool_id} className="grid grid-cols-12 gap-6 items-center p-4 border rounded hover:bg-gray-50 transition-colors">
                          <div className="col-span-1 flex justify-center">
                            <Checkbox
                              checked={isToolSelected(tool.tool_id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addToolToSelection(tool);
                                } else {
                                  removeToolFromSelection(tool.tool_id);
                                }
                              }}
                            />
                          </div>
                          <div className="col-span-8">
                            <span className="font-medium text-lg">{tool.tool_name}</span>
                            <div className="text-sm text-gray-500 mt-1">
                              Disponível: {tool.available_quantity} unidade(s)
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            {isToolSelected(tool.tool_id) && (
                              <Badge variant="secondary">Selecionada</Badge>
                            )}
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <Button 
                              variant={isToolSelected(tool.tool_id) ? "secondary" : "outline"} 
                              size="sm"
                              onClick={() => {
                                if (isToolSelected(tool.tool_id)) {
                                  removeToolFromSelection(tool.tool_id);
                                } else {
                                  addToolToSelection(tool);
                                }
                              }}
                              className="w-full min-w-[100px]"
                            >
                              {isToolSelected(tool.tool_id) ? 'Remover' : 'Selecionar'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setShowPreview(true)}
                    disabled={selectedTools.length === 0 || !targetUserId}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar Atribuições
                  </Button>
                </div>
              </div>
            ) : (
              /* Preview das Atribuições */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Preview das Atribuições</h3>
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    Voltar
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Usuário Destino</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg">
                      {users.find(u => u.id === targetUserId)?.username} 
                      <span className="text-sm text-gray-500 ml-2">
                        ({users.find(u => u.id === targetUserId)?.role})
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ferramentas a Atribuir ({selectedTools.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTools.map((tool) => (
                        <div key={tool.tool_id} className="grid grid-cols-12 gap-6 items-center p-4 border rounded hover:bg-gray-50">
                          <div className="col-span-8">
                            <span className="font-medium text-lg">{tool.tool_name}</span>
                            <div className="text-sm text-gray-500 mt-1">
                              Disponível: {tool.available_quantity} | Selecionado: {tool.selected_quantity}
                            </div>
                          </div>
                          <div className="col-span-4 flex justify-end">
                            <Badge variant="outline" className="px-4 py-2 text-base">
                              Quantidade: {tool.selected_quantity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Total de Ferramentas: {selectedTools.length}</strong>
                        </div>
                        <div className="text-right">
                          <strong>Total de Itens: {selectedTools.reduce((sum, tool) => sum + tool.selected_quantity, 0)}</strong>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleMultipleAssignments}>
                    Confirmar Atribuições
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo de Ferramentas Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Ferramentas Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Filtrar ferramentas..."
              value={toolSearchTerm}
              onChange={(e) => setToolSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            {filteredToolOptions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma ferramenta disponível para atribuição
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredToolOptions.map((tool) => (
                  <Card key={tool.tool_id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{tool.tool_name}</h3>
                      {isToolSelected(tool.tool_id) && (
                        <Badge variant="secondary" className="ml-2">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Quantidade disponível: {tool.available_quantity}
                    </p>
                    <Button 
                      variant={isToolSelected(tool.tool_id) ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => {
                        if (isToolSelected(tool.tool_id)) {
                          removeToolFromSelection(tool.tool_id);
                        } else {
                          addToolToSelection(tool);
                        }
                      }}
                      className="w-full"
                    >
                      {isToolSelected(tool.tool_id) ? 'Remover' : 'Selecionar'}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Barra de Status */}
          {selectedTools.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">
                    {selectedTools.length} ferramenta(s) selecionada(s)
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    Total: {selectedTools.reduce((sum, tool) => sum + tool.selected_quantity, 0)} item(s)
                  </span>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} disabled={!targetUserId && selectedTools.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Abrir Atribuição
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentsPage;

