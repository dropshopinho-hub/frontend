import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, RotateCcw, Package } from 'lucide-react';

const DashboardToolsStatus = () => {
  const [statusSummary, setStatusSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatusSummary();
  }, []);

  const fetchStatusSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/tools', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Agrupa por status
        const summary = {};
        data.tools.forEach(tool => {
          if (!summary[tool.status]) summary[tool.status] = 0;
          summary[tool.status] += tool.quantity;
        });
        setStatusSummary(Object.entries(summary));
      } else {
        setError('Erro ao carregar dados das ferramentas');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard de Status das Ferramentas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
          {loading ? (
            <p>Carregando...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statusSummary.map(([status, quantity]) => {
                let icon = <Package className="w-8 h-8 mb-1 text-gray-400" />;
                let bg = 'bg-gray-100';
                let color = 'text-gray-700';
                if (status === 'Disponível') {
                  icon = <CheckCircle className="w-8 h-8 mb-1 text-green-500" />;
                  bg = 'bg-green-50';
                  color = 'text-green-700';
                } else if (status === 'Emprestado') {
                  icon = <RotateCcw className="w-8 h-8 mb-1 text-blue-500" />;
                  bg = 'bg-blue-50';
                  color = 'text-blue-700';
                } else if (status === 'Recusada') {
                  icon = <XCircle className="w-8 h-8 mb-1 text-red-500" />;
                  bg = 'bg-red-50';
                  color = 'text-red-700';
                }
                return (
                  <div key={status} className={`flex flex-col items-center p-3 rounded-lg shadow ${bg}`} style={{ minHeight: 100 }}>
                    {icon}
                    <h3 className={`text-base mb-1 ${color}`}>{status || 'Disponível'}
</h3>
                    <p className="text-xl mt-1">{quantity}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardToolsStatus;
