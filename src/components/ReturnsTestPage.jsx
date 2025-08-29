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
    (tool.name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ... resto do componente sem alterações ... */}
    </div>
  );
}

export default ReturnsTestPage;
