import React, { useState, useEffect } from 'react';
import { exportToolsToCSV } from '../lib/exportToolsToCSV';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search } from 'lucide-react';

const ToolsPage = () => {
  const { token, isAdmin } = useAuth();
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTool, setNewTool] = useState({ name: '', quantity: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [toolToEdit, setToolToEdit] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState(null);
  const [actionError, setActionError] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const openEditDialog = (tool) => {
    setToolToEdit(tool);
    setEditQuantity(tool.quantity);
    setEditStatus(tool.status);
    setEditDialogOpen(true);
    setActionError('');
  }

  const handleEditTool = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const body = { quantity: parseInt(editQuantity) };
      const response = await apiFetch(`/api/tools/${toolToEdit.tool_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        setEditDialogOpen(false);
        setToolToEdit(null);
        fetchTools();
      } else {
        const error = await response.json();
        setActionError(error.error || 'Erro ao editar ferramenta');
      }
    } catch (err) {
      setActionError('Erro de conexão');
    }
  }

  const openDeleteConfirm = (tool) => {
    setToolToDelete(tool);
    setDeleteConfirmOpen(true);
    setActionError('');
  };

  const handleDeleteTool = async () => {
    setActionError('');
    try {
      const response = await apiFetch(`/api/tools/${toolToDelete.tool_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setDeleteConfirmOpen(false);
        setToolToDelete(null);
        fetchTools();
      } else {
        const error = await response.json();
        setActionError(error.error || 'Erro ao excluir ferramenta');
      }
    } catch (err) {
      setActionError('Erro de conexão');
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    let filtered = tools.filter(tool =>
      (tool.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
      (tool.username || '').toLowerCase().includes((searchTerm || '').toLowerCase())
      (tool.status || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );
    if (userFilter && userFilter !== 'todos') {
      filtered = filtered.filter(tool => tool.username === userFilter);
    }
    setFilteredTools(filtered);
  }, [tools, searchTerm, userFilter]);

  const fetchTools = async () => {
    try {
      const response = await apiFetch('/api/tools', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTools(data.tools);
      } else {
        setError('Erro ao carregar ferramentas');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  // ALTERAÇÃO: Adiciona status "Disponível" ao criar ferramenta
  const handleAddTool = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiFetch('/api/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTool.name,
          quantity: parseInt(newTool.quantity),
          status: "Disponível" // <-- Adicionado aqui!
        })
      });

      if (response.ok) {
        setNewTool({ name: '', quantity: '' });
        setIsDialogOpen(false);
        fetchTools();
      } else {
        const error = await response.json();
        setError(error.error);
      }
    } catch (error) {
      setError('Erro de conexão');
    }
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Carregando ferramentas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ferramentas</h2>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Ferramenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Ferramenta</DialogTitle>
                <DialogDescription>
                  Preencha os dados da nova ferramenta
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTool} className="space-y-4">
                <Label htmlFor="tool-name">Nome</Label>
                <Input
                  id="tool-name"
                  value={newTool.name}
                  onChange={e => setNewTool({ ...newTool, name: e.target.value })}
                  required
                />
                <Label htmlFor="tool-quantity">Quantidade</Label>
                <Input
                  id="tool-quantity"
                  type="number"
                  min="1"
                  value={newTool.quantity}
                  onChange={e => setNewTool({ ...newTool, quantity: e.target.value })}
                  required
                />
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
                    Adicionar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtro de Usuário e Busca */}
      <div className="flex gap-4 items-center mb-2">
        <div>
          <Label>Filtrar por Usuário:</Label>
          <select
            className="border rounded px-2 py-1"
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            {[...new Set(tools.map(t => t.username).filter(Boolean))].map(username => (
              <option key={username} value={username}>{username}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome da ferramenta, usuário ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => exportToolsToCSV(filteredTools, [
            'Nome da Ferramenta',
            'Quantidade',
            'Usuário',
            'Data de Atribuição',
            'Status'
          ])}
        >Baixar Lista</Button>
      </div>

      {/* Tools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ferramentas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            {filteredTools.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {tools.length === 0 ? 'Nenhuma ferramenta cadastrada' : 'Nenhuma ferramenta encontrada'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Ferramenta</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data de Atribuição</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.map((tool, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>{tool.quantity}</TableCell>
                      <TableCell>{tool.username || '-'}</TableCell>
                      <TableCell>
                        {tool.assigned_at ? new Date(tool.assigned_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tool.status)}`}>
                          {tool.status || 'Disponível'}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(tool)}>Editar</Button>
                          <Button size="sm" variant="destructive" onClick={() => openDeleteConfirm(tool)}>Excluir</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de edição de ferramenta */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ferramenta</DialogTitle>
            <DialogDescription>Altere os dados da ferramenta</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTool} className="space-y-4">
            <Label>Nome</Label>
            <Input value={toolToEdit?.name || ''} disabled />
            <Label>Quantidade</Label>
            <Input type="number" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} min={1} required />
            <div className="flex gap-2 mt-4">
              <Button type="submit" variant="success">Salvar</Button>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            </div>
            {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir a ferramenta "{toolToDelete?.name}"?</DialogDescription>
          </DialogHeader>
          {actionError && (
            <Alert variant="destructive">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteTool}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};