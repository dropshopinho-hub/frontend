import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RejectedAssignmentsPage = () => {
  const { token, isAdmin } = useAuth();
  const [rejectedAssignments, setRejectedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) fetchRejectedAssignments();
  }, [isAdmin]);

  const fetchRejectedAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/assignments/rejected', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRejectedAssignments(data.rejected_assignments || []);
        setError('');
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || errData.msg || `Erro ao carregar recusadas (${response.status})`);
      }
    } catch (e) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };


  const [editStatusMap, setEditStatusMap] = useState({});

  const handleStatusChange = (instanceId, value) => {
    setEditStatusMap(prev => ({ ...prev, [instanceId]: value }));
  };

  const handleUpdateStatus = async (instanceId) => {
    setError('');
    try {
      const newStatus = editStatusMap[instanceId];
      if (newStatus === 'Disponível') {
        const response = await fetch(`/api/assignments/${instanceId}/confirm_rejected`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchRejectedAssignments();
        } else {
          setError('Erro ao atualizar status');
        }
      }
    } catch {
      setError('Erro de conexão');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Atribuições Recusadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : rejectedAssignments.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhuma atribuição recusada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Ferramenta</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Usuário que recusou</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedAssignments.map(item => (
                  <TableRow key={item.instance_id}>
                    <TableCell>{item.tool_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.username}</TableCell>
                    <TableCell>
                      <select
                        value={editStatusMap[item.instance_id] || 'Recusada'}
                        onChange={e => handleStatusChange(item.instance_id, e.target.value)}
                        className="border rounded px-2 py-1 mr-2"
                      >
                        <option value="Recusada">Recusada</option>
                        <option value="Disponível">Disponível</option>
                      </select>
                      <Button
                        size="sm"
                        variant="success"
                        disabled={editStatusMap[item.instance_id] !== 'Disponível'}
                        onClick={() => handleUpdateStatus(item.instance_id)}
                      >Salvar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RejectedAssignmentsPage;
