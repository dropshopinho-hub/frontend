import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, Check, X } from 'lucide-react';

const ReturnsPage = () => {
  const { token, user, isAdmin } = useAuth();
  const [borrowedTools, setBorrowedTools] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!isAdmin) {
        // Fetch user's borrowed tools
        const assignmentsResponse = await apiFetch(`/api/assignments/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          setBorrowedTools(assignmentsData.confirmed || []);
        }
      }

      if (isAdmin) {
        // Fetch pending returns for admin
        const returnsResponse = await apiFetch('/api/returns/pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (returnsResponse.ok) {
          const returnsData = await returnsResponse.json();
          setPendingReturns(returnsData.pending_returns || []);
        }
      }
    } catch (error) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedTools.length === 0) {
      setError('Selecione pelo menos uma ferramenta para devolver.');
      return;
    }
    try {
      for (const toolId of selectedTools) {
        const response = await apiFetch('/api/returns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tool_instance_id: toolId })
        });
        if (!response.ok) {
          const error = await response.json();
          setError(error.error || 'Erro ao solicitar devolução.');
          return;
        }
      }
      setSelectedTools([]);
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleAcceptReturn = async (returnId) => {
    try {
      const response = await apiFetch(`/api/returns/${returnId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        setError(error.error);
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleRejectReturn = async (returnId) => {
    try {
      const response = await apiFetch(`/api/returns/${returnId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        setError(error.error);
      }
    } catch (error) {
      setError('Erro de conexão');
    }
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

  // Filtra ferramentas pelo nome
  const filteredTools = borrowedTools.filter(tool =>
    tool.tool_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Devoluções</h2>
        {!isAdmin && borrowedTools.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><RotateCcw className="w-4 h-4 mr-2" />Nova Devolução</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Devolver Ferramentas</DialogTitle>
                <DialogDescription>Selecione as ferramentas que deseja devolver</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleReturn} className="space-y-4">
                <div>
                  <Label>Pesquisar</Label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 mb-2"
                    placeholder="Digite para filtrar pelo nome da ferramenta..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="mb-2"
                    variant="outline"
                    onClick={() => {
                      if (filteredTools.length === 0) return;
                      const allIds = filteredTools.map(t => t.id);
                      const allSelected = allIds.every(id => selectedTools.includes(id));
                      if (allSelected) {
                        setSelectedTools(selectedTools.filter(id => !allIds.includes(id)));
                      } else {
                        setSelectedTools(Array.from(new Set([...selectedTools, ...allIds])));
                      }
                    }}
                  >
                    {filteredTools.length > 0 && filteredTools.every(t => selectedTools.includes(t.id)) ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                  </Button>
                  <div style={{ maxHeight: 300, overflowY: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead></TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Data de Confirmação</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTools.map((tool) => (
                          <TableRow key={tool.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedTools.includes(tool.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedTools([...selectedTools, tool.id]);
                                  } else {
                                    setSelectedTools(selectedTools.filter(id => id !== tool.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>{tool.tool_name}</TableCell>
                            <TableCell>{tool.quantity}</TableCell>
                            <TableCell>{tool.assigned_at ? new Date(tool.assigned_at).toLocaleDateString('pt-BR') : '-'}</TableCell>
                            <TableCell>{tool.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                )}
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Solicitar Devolução</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Fim do bloco principal. Remover bloco antigo duplicado abaixo */}
      {/*
            <DialogTrigger asChild>
              <Button>
                <RotateCcw className="w-4 h-4 mr-2" />
                Nova Devolução
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Devolver Ferramenta</DialogTitle>
                <DialogDescription>
                  Selecione a ferramenta que deseja devolver
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleReturn} className="space-y-4">
                <div>
                  <Label htmlFor="tool-select">Ferramenta</Label>
                  <Select value={returnData.tool_instance_id} onValueChange={(value) => setReturnData({ ...returnData, tool_instance_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma ferramenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {borrowedTools.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id}>
                          {tool.tool_name} (Quantidade: {tool.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Devolver
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      */}

      {/* Admin View - Pending Returns */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Devoluções Pendentes de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingReturns.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma devolução pendente
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data da Solicitação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReturns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">{returnItem.tool_name}</TableCell>
                      <TableCell>{returnItem.quantity}</TableCell>
                      <TableCell>{returnItem.current_user_name}</TableCell>
                      <TableCell>
                        {new Date(returnItem.assigned_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptReturn(returnItem.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectReturn(returnItem.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* User View - Borrowed Tools Available for Return */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Ferramentas Disponíveis para Devolução</CardTitle>
          </CardHeader>
          <CardContent>
            {borrowedTools.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Você não possui ferramentas emprestadas para devolver
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data de Confirmação</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowedTools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.tool_name}</TableCell>
                      <TableCell>{tool.quantity}</TableCell>
                      <TableCell>
                        {new Date(tool.assigned_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          {tool.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona a Devolução</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            {isAdmin ? (
              <>
                <p>1. Visualize as solicitações de devolução dos usuários</p>
                <p>2. Aceite a devolução para retornar a ferramenta ao estoque</p>
                <p>3. Recuse a devolução para manter a ferramenta com o usuário</p>
              </>
            ) : (
              <>
                <p>1. Selecione uma ferramenta que você possui emprestada</p>
                <p>2. A solicitação de devolução será enviada ao administrador</p>
                <p>3. Aguarde a aprovação do administrador</p>
                <p>4. Se aprovada, a ferramenta retornará ao estoque</p>
                <p>5. Se recusada, a ferramenta permanecerá com você</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default ReturnsPage;

