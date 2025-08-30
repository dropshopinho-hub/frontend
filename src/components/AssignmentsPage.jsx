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
import { Plus } from 'lucide-react';

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
  const [assignment, setAssignment] = useState({
    tool_id: '',
    user_id: '',
    quantity: '1'
  });

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
        setUsers(usersData.users || []);
      }
    } catch (error) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tool_id: assignment.tool_id,
          user_id: assignment.user_id,
          quantity: parseInt(assignment.quantity)
        })
      });

      if (response.ok) {
        setAssignment({ tool_id: '', user_id: '', quantity: '1' });
        setIsDialogOpen(false);
        setSuccessMessage('Ferramenta atribuída com sucesso!');
        fetchData(); // Refresh available tools
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const error = await response.json();
        setError(error.error);
      }
    } catch (error) {
      setError('Erro de conexão');
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

  const toolOptions = Object.values(groupedTools);

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Atribuição
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir Ferramenta</DialogTitle>
              <DialogDescription>
                Selecione a ferramenta, quantidade e usuário para atribuição
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignment} className="space-y-4">
              <div>
                <Label htmlFor="tool-select">Ferramenta</Label>
                <Select value={assignment.tool_id} onValueChange={(value) => setAssignment({ ...assignment, tool_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma ferramenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {toolOptions.map((tool) => (
                      <SelectItem key={tool.tool_id} value={tool.tool_id}>
                        {tool.tool_name} (Disponível: {tool.available_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={assignment.tool_id ? groupedTools[`${toolOptions.find(t => t.tool_id === assignment.tool_id)?.tool_name}_${assignment.tool_id}`]?.available_quantity || 1 : 1}
                  value={assignment.quantity}
                  onChange={(e) => setAssignment({ ...assignment, quantity: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="user-select">Usuário</Label>
                <Select value={assignment.user_id} onValueChange={(value) => setAssignment({ ...assignment, user_id: value })}>
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
                  Atribuir
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Tools Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas Disponíveis para Atribuição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            {toolOptions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma ferramenta disponível para atribuição
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {toolOptions.map((tool) => (
                  <Card key={tool.tool_id} className="p-4">
                    <h3 className="font-medium">{tool.tool_name}</h3>
                    <p className="text-sm text-gray-600">
                      Quantidade disponível: {tool.available_quantity}
                    </p>
                    <Button variant="outline" onClick={() => setShowContactPopup(true)} style={{marginTop: '8px'}}>Recusar</Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentsPage;

