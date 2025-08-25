import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRightLeft } from 'lucide-react';

const TransfersPage = () => {
  const { token, user } = useAuth();
  const [borrowedTools, setBorrowedTools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState([]);
    const [toUserId, setToUserId] = useState('');
    const [toolSearch, setToolSearch] = useState('');
    const [selectAllTools, setSelectAllTools] = useState(false);
    const filteredTools = borrowedTools.filter(tool =>
      tool.tool_name.toLowerCase().includes(toolSearch.toLowerCase())
    );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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

      // Fetch users
      const usersResponse = await apiFetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Filter out current user
        setUsers((usersData.users || []).filter(u => u.id !== user.id));
      }
    } catch (error) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedTools.length === 0) {
      setError('Selecione pelo menos uma ferramenta para transferir.');
      return;
    }
    if (!toUserId) {
      setError('Selecione o usuário de destino.');
      return;
    }
    try {
      for (const toolId of selectedTools) {
        const response = await apiFetch('/api/transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tool_instance_id: toolId, to_user_id: toUserId })
        });
        if (!response.ok) {
          const error = await response.json();
          setError(error.error || 'Erro ao solicitar transferência.');
          return;
        }
      }
      setSelectedTools([]);
      setToUserId('');
      setIsDialogOpen(false);
      fetchData();
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transferências</h2>
        {borrowedTools.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Nova Transferência
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transferir Ferramentas</DialogTitle>
                <DialogDescription>
                  Selecione as ferramentas e o usuário de destino
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <Label>Ferramentas</Label>
                  <input
                    type="text"
                    placeholder="Pesquisar ferramenta..."
                    className="mb-2 w-full border rounded px-2 py-1"
                    value={toolSearch}
                    onChange={e => setToolSearch(e.target.value)}
                  />
                  <div className="mb-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectAllTools}
                        onChange={e => {
                          setSelectAllTools(e.target.checked);
                          if (e.target.checked) {
                            setSelectedTools(filteredTools.map(tool => tool.id));
                          } else {
                            setSelectedTools([]);
                          }
                        }}
                      />
                      Selecionar todas as ferramentas
                    </label>
                  </div>
                  <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
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
                <div>
                  <Label>Usuário de Destino</Label>
                  <Select value={toUserId} onValueChange={setToUserId}>
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
                    Transferir
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Borrowed Tools Available for Transfer */}
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas Disponíveis para Transferência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
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
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona a Transferência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Selecione uma ferramenta que você possui emprestada</p>
            <p>2. Escolha o usuário que receberá a ferramenta</p>
            <p>3. A transferência ficará pendente até que o usuário de destino aceite</p>
            <p>4. Se aceita, a ferramenta será transferida para o novo usuário</p>
            <p>5. Se recusada, a ferramenta permanecerá com você</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransfersPage;

