import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AssignmentsPage = () => {
  const { token } = useAuth();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactPopup, setShowContactPopup] = useState(false);

  useEffect(() => {
    fetchTools();
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

  const availableTools = tools.filter(tool => tool.status === 'Disponível');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas Disponíveis</CardTitle>
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
                    onClick={() => setShowContactPopup(true)}
                  >
                    Solicitar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Popup de contato, se necessário */}
      {showContactPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="font-bold mb-2">Contato para Solicitação</h2>
            <p>Entre em contato com o responsável para solicitar a ferramenta.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowContactPopup(false)}
              className="mt-4"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export