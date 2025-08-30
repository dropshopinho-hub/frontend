import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw } from 'lucide-react';

const ReturnsPage = () => {
  const { token, user } = useAuth();
  const [borrowedTools, setBorrowedTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setBorrowedTools(data.confirmed || []);
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Devoluções
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

          {borrowedTools.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Você não possui ferramentas emprestadas para devolver</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data de Confirmação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowedTools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name || '-'}</TableCell>
                      <TableCell>{tool.quantity}</TableCell>
                      <TableCell>
                        {tool.assigned_at ? new Date(tool.assigned_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          {tool.status || 'Emprestado'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleReturn(tool)}
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Devolver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
