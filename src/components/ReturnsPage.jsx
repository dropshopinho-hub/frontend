import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReportsPage = () => {
  const { token } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({ name: '', user_name: '' });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await apiFetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReportData(data.reports || []);
      }
    } catch (error) {
      // Trate o erro conforme necessário
    }
  };

  // Filtro seguro usando toLowerCase
  const filteredData = reportData.filter(item => {
    const toolMatch = (item.name || '').toLowerCase().includes((filters.name || '').toLowerCase());
    const userMatch = (item.username || '').toLowerCase().includes((filters.user_name || '').toLowerCase());
    return toolMatch && userMatch;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Filtrar por ferramenta"
              value={filters.name}
              onChange={e => setFilters({ ...filters, name: e.target.value })}
            />
            <Input
              placeholder="Filtrar por usuário"
              value={filters.user_name}
              onChange={e => setFilters({ ...filters, user_name: e.target.value })}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Ferramenta</th>
                  <th>Usuário</th>
                  <th>Quantidade</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      Nenhum relatório encontrado
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.username}</td>
                      <td>{item.quantity}</td>
                      <td>{item.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
