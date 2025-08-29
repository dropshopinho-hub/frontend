import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AssignmentsPage = () => {
  const { token } = useAuth();
  const [tools, setTools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTools();
    fetchUsers();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/tools', {
        headers: { 'Authorization': `Bearer ${token}` }
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

  const fetchUsers = async () => {
    try {
      const response = await apiFetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      // Trate erros conforme necessário
    }
  };

  const availableTools = tools.filter(tool => tool.status === 'Disponível');

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedToolId || !selectedUserId || !quantity) {
      setError('Selecione a ferramenta, usuário e quantidade.');
      return;
    }
    try {
      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tool_id: selectedToolId,
          user_id: selectedUserId,
          quantity: parseInt(quantity)
        })
      });
      if (response.ok) {
        setSuccess('Ferramenta atribuída com sucesso!');
        setAssignDialogOpen(false);
        setSelectedToolId('');
        setSelectedUserId('');
        setQuantity(1);
        fetchTools();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao atribuir ferramenta.');
      }
    } catch (error) {
      setError('Erro de conexão.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas Disponíveis para Atribuição</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando ferramentas...</p>
          ) : availableTools.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhuma ferramenta disponível</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTools.map(tool => (
                <div key={tool.id} className="border rounded p-4 shadow">
                  <h3 className="font-bold text-lg">{tool.name}</h3>
                  <p>Quantidade: {tool.quantity}</p>
                  <p className="text-sm text-gray-600">
                    Status: {tool.status || 'Disponível'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedToolId(tool.id);
                      setAssignDialogOpen(true);
                    }}
                  >
                    Atribuir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de atribuição */}
      {assignDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[320px]">
            <h2 className="font-bold mb-2">Atribuir Ferramenta</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <Label>Ferramenta</Label>
                <select
                  value={selectedToolId}
                  onChange={e => setSelectedToolId(e.target.value)}
                  required
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Selecione uma ferramenta</option>
                  {availableTools.map(tool => (
                    <option key={tool.id} value={tool.id}>{tool.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Usuário</Label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  required
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Selecione um usuário</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Atribuir
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );