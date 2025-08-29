// src/pages/MyToolsPage.jsx

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X } from 'lucide-react';

const MyToolsPage = () => {
  const [infoMessage, setInfoMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [pendingSearch, setPendingSearch] = useState('');
  const [borrowedSearch, setBorrowedSearch] = useState('');
  const { token, user } = useAuth();
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [confirmedAssignments, setConfirmedAssignments] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssignments();
    fetchPendingTransfers();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await apiFetch(`/api/assignments/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingAssignments(data.pending || []);
        setConfirmedAssignments(data.confirmed || []);
      } else {
        setError('Erro ao carregar atribuições');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const fetchPendingTransfers = async () => {
    try {
      const response = await apiFetch(`/api/transfers/pending/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingTransfers(data.pending_transfers || []);
      }
    } catch (error) {
      console.error('Erro ao carregar transferências pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssignment = async (assignmentId) => {
    try {
      const response = await apiFetch(`/api/assignments/${assignmentId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        const error = await response.json();
        setError(error.error);
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleRejectAssignment = () => {
    setInfoMessage('Entre em contato com o Responsável para recusar a atribuição.');
    setTimeout(() => setInfoMessage(''), 5000);
  };

  const handleConfirmTransfer = async (transferId) => {
    try {
      const response = await apiFetch(`/api/transfers/${transferId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchAssignments();
        fetchPendingTransfers();
      } else {
        const error = await response.json();
        setError(error.error);
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleRejectTransfer = async (transferId) => {
    try {
      const response = await apiFetch(`/api/transfers/${transferId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchPendingTransfers();
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
          <p>Carregando suas ferramentas...</p>
        </CardContent>
      </Card>
    );
  }

  // Sorting function
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filter and sort pending assignments
  const filteredPendingAssignments = pendingAssignments.filter(a =>
    ((a.name || '').toLowerCase().includes((pendingSearch || '').toLowerCase())) ||
    String(a.quantity).includes(pendingSearch) ||
    new Date(a.assigned_at).toLocaleDateString('pt-BR').includes(pendingSearch)
  );
  const sortedPendingAssignments = [...filteredPendingAssignments].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (sortConfig.key === 'assigned_at') {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter and sort confirmed assignments (borrowed tools)
  const filteredConfirmedAssignments = confirmedAssignments.filter(a =>
    ((a.name || '').toLowerCase().includes((borrowedSearch || '').toLowerCase())) ||
    String(a.quantity).includes(borrowedSearch) ||
    new Date(a.assigned_at).toLocaleDateString('pt-BR').includes(borrowedSearch) ||
    (a.status && a.status.toLowerCase().includes(borrowedSearch.toLowerCase()))
  );
  const sortedConfirmedAssignments = [...filteredConfirmedAssignments].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (sortConfig.key === 'assigned_at') {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Minhas Ferramentas</h2>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {infoMessage && (
        <div style={{ color: 'red', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '1rem' }}>
          {infoMessage}
        </div>
      )}

      {/* Pending Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Atribuições Pendentes de Confirmação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <Input
              placeholder="Pesquisa avançada..."
              value={pendingSearch}
              onChange={e => setPendingSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
            {sortedPendingAssignments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Nenhuma atribuição pendente
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Ferramenta</TableHead>
                    <TableHead onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Quantidade</TableHead>
                    <TableHead onClick={() => handleSort('assigned_at')} style={{ cursor: 'pointer' }}>Data de Atribuição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPendingAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.name}</TableCell>
                      <TableCell>{assignment.quantity}</TableCell>
                      <TableCell>
                        {new Date(assignment.assigned_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmAssignment(assignment.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRejectAssignment}
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
          </div>
        </CardContent>
      </Card>

      {/* Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transferências Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data da Transferência</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.name}</TableCell>
                      <TableCell>{transfer.quantity}</TableCell>
                      <TableCell>
                        {new Date(transfer.transfer_initiated_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmTransfer(transfer.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectTransfer(transfer.id)}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas Emprestadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <Input
              placeholder="Pesquisa avançada..."
              value={borrowedSearch}
              onChange={e => setBorrowedSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
            {sortedConfirmedAssignments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Nenhuma ferramenta emprestada
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Ferramenta</TableHead>
                    <TableHead onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Quantidade</TableHead>
                    <TableHead onClick={() => handleSort('assigned_at')} style={{ cursor: 'pointer' }}>Data de Confirmação</TableHead>
                    <TableHead onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedConfirmedAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.name}</TableCell>
                      <TableCell>{assignment.quantity}</TableCell>
                      <TableCell>
                        {new Date(assignment.assigned_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          {assignment.status}
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
    </div>
  );
};

export default MyToolsPage;
