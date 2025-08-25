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

const ReturnsTestPage = () => {
  const { token, user, isAdmin } = useAuth();
  const [borrowedTools, setBorrowedTools] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [toolQuantities, setToolQuantities] = useState({});
  // Buscar usuários para transferência
  useEffect(() => {
    if (!isAdmin && isDialogOpen) {
      apiFetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUsers(data.users || []))
        .catch(() => setUsers([]));
    }
  }, [isDialogOpen, isAdmin, token]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!isAdmin) {
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

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedUser) {
      setError("Selecione o usuário de destino.");
      return;
    }
    if (selectedTools.length === 0) {
      setError("Selecione pelo menos uma ferramenta para transferir.");
      return;
    }
    try {
      for (const toolId of selectedTools) {
        const quantity = toolQuantities[toolId] || 1;
        // Envia uma requisição para cada unidade (ajuste se backend aceitar quantidade)
        for (let i = 0; i < quantity; i++) {
          const response = await apiFetch('/api/transfers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tool_instance_id: toolId, to_user_id: selectedUser })
          });
          if (!response.ok) {
            const error = await response.json();
            setError(error.error || 'Erro ao solicitar transferência.');
            return;
          }
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

  const filteredTools = borrowedTools.filter(tool =>
    tool.tool_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
  <h2 className="text-2xl font-bold">Transferência GP</h2>
        {!isAdmin && borrowedTools.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><RotateCcw className="w-4 h-4 mr-2" />Nova Transferência</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transferência GP</DialogTitle>
                <DialogDescription>Selecione as ferramentas que deseja transferir</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <Label>Usuário de Destino</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <div className="overflow-x-auto overflow-y-auto max-h-[40vh]" style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
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
                                    setToolQuantities(q => ({ ...q, [tool.id]: 1 }));
                                  } else {
                                    setSelectedTools(selectedTools.filter(id => id !== tool.id));
                                    setToolQuantities(q => { const nq = { ...q }; delete nq[tool.id]; return nq; });
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>{tool.tool_name}</TableCell>
                            <TableCell>
                              <input
                                type="number"
                                min={1}
                                max={tool.quantity}
                                value={toolQuantities[tool.id] || 1}
                                disabled={!selectedTools.includes(tool.id)}
                                onChange={e => {
                                  const val = Math.max(1, Math.min(Number(e.target.value), tool.quantity));
                                  setToolQuantities(q => ({ ...q, [tool.id]: val }));
                                }}
                                style={{ width: 60 }}
                              />
                            </TableCell>
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
                  <Button type="submit">Solicitar Transferência</Button>
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

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Transferências GP Pendentes de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingReturns.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma transferência pendente
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

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Ferramentas Disponíveis para Transferência GP</CardTitle>
          </CardHeader>
          <CardContent>
            {borrowedTools.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Você não possui ferramentas emprestadas para transferir
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

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona a Transferência GP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            {isAdmin ? (
              <>
                <p>1. Visualize as solicitações de transferência GP dos usuários</p>
                <p>2. Aceite a transferência GP para transferir a ferramenta</p>
                <p>3. Recuse a transferência GP para manter a ferramenta com o usuário</p>
              </>
            ) : (
              <>
                <p>1. Selecione uma ferramenta que você possui emprestada</p>
                <p>2. A solicitação de transferência GP será enviada ao administrador</p>
                <p>3. Aguarde a aprovação do administrador</p>
                <p>4. Se aprovada, a ferramenta será transferida</p>
                <p>5. Se recusada, a ferramenta permanecerá com você</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default ReturnsTestPage;
