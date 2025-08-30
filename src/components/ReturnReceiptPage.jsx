import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, User, Package } from 'lucide-react';

const ReturnReceiptPage = () => {
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, token } = useAuth();

  const apiFetch = async (url, options = {}) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    return response;
  };

  const fetchPendingReturns = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching pending returns...');
      console.log('User:', user);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await apiFetch('/api/returns/pending');
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Pending returns data:', data);
        setPendingReturns(data);
      } else {
        console.log('Error response:', response);
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          setError(errorData.error || 'Erro ao carregar devoluções pendentes');
        } catch (parseError) {
          console.log('Could not parse error response as JSON');
          setError(`Erro ${response.status}: ${response.statusText}`);
        }
      }
    } catch (err) {
      console.error('Error fetching pending returns:', err);
      setError('Erro de conexão ao carregar devoluções pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (toolInstanceId, toolName) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await apiFetch(`/api/returns/approve/${toolInstanceId}`, {
        method: 'POST'
      });

      if (response.ok) {
        setSuccess(`Devolução da ferramenta "${toolName}" aprovada com sucesso!`);
        fetchPendingReturns(); // Recarrega a lista
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao aprovar devolução');
      }
    } catch (err) {
      console.error('Error approving return:', err);
      setError('Erro de conexão ao aprovar devolução');
    }
  };

  const handleReject = async (toolInstanceId, toolName) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await apiFetch(`/api/returns/reject/${toolInstanceId}`, {
        method: 'POST'
      });

      if (response.ok) {
        setSuccess(`Devolução da ferramenta "${toolName}" rejeitada. Ferramenta retornada ao usuário.`);
        fetchPendingReturns(); // Recarrega a lista
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao rejeitar devolução');
      }
    } catch (err) {
      console.error('Error rejecting return:', err);
      setError('Erro de conexão ao rejeitar devolução');
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchPendingReturns();
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-lg">Carregando devoluções pendentes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Recebimento de Devoluções
        </h1>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {pendingReturns.length} pendente(s)
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {pendingReturns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma devolução pendente
            </h3>
            <p className="text-gray-500 text-center">
              Todas as devoluções foram processadas ou não há solicitações no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingReturns.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-yellow-400">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span>{item.tool_name || 'Ferramenta não identificada'}</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Usuário</p>
                      <p className="font-medium">{item.user_name || 'Usuário não identificado'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantidade</p>
                    <p className="font-medium">1 unidade</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data da Solicitação</p>
                    <p className="font-medium">
                      {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(item.id, item.tool_name)}
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Recusar
                  </Button>
                  <Button
                    onClick={() => handleApprove(item.id, item.tool_name)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aceitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnReceiptPage;
