import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert } from './ui/alert';

export default function UserAdminList() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
  const response = await apiFetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Erro ao carregar usuários');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEdit = (user) => {
    setEditUser(user);
    setEditData({ username: user.username, password: '', role: user.role });
    setSuccess('');
    setError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
  const response = await apiFetch(`/api/auth/admin/edit-user/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setSuccess('Usuário atualizado com sucesso!');
        setEditUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao atualizar usuário');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Deseja realmente deletar o usuário ${user.username}?`)) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
  const response = await apiFetch(`/api/auth/admin/delete-user/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccess('Usuário deletado com sucesso!');
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao deletar usuário');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Gerenciar Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="destructive">{error}</Alert>}
        {loading && <p>Carregando...</p>}
        {!loading && (
          <>
            <table className="w-full mb-6 text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Usuário</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t">
                    <td className="p-2">{user.username}</td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2 space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user)}>Deletar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editUser && (
              <form onSubmit={handleEditSubmit} className="space-y-4 border p-4 rounded bg-gray-50">
                <h3 className="font-bold">Editar Usuário: {editUser.username}</h3>
                <div>
                  <label className="block mb-1 font-medium">Usuário</label>
                  <Input value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Nova Senha (opcional)</label>
                  <Input type="password" value={editData.password} onChange={e => setEditData({ ...editData, password: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Tipo</label>
                  <select className="w-full border rounded px-2 py-1" value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })}>
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading}>Salvar</Button>
                  <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
