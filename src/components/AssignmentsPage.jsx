import React, { useEffect, useState } from "react";
import apiFetch from "../utils/apiFetch"; // ajuste o caminho se necessário

const AssignmentsPage = ({ token }) => {
  const [tools, setTools] = useState([]);
  const [toolNames, setToolNames] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedToolId, setSelectedToolId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchTools();
    fetchToolNames();
    fetchUsers();
  }, []);

  // Busca instâncias disponíveis
  const fetchTools = async () => {
    setLoading(true);
    try {
      // Use o endpoint correto do backend
      const response = await apiFetch("/api/tools/instances?status=Disponível", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Ferramentas disponíveis:", data); // Ajuda a depurar
        setTools(data.tools || []); // <-- Corrigido aqui!
      } else {
        setTools([]);
      }
    } catch (error) {
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  // Busca nomes das ferramentas
  const fetchToolNames = async () => {
    try {
      const response = await apiFetch("/api/tools", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Cria um mapa tool_id => name
        const namesMap = {};
        (data.tools || []).forEach((tool) => {
          namesMap[tool.id] = tool.name;
        });
        setToolNames(namesMap);
      }
    } catch (error) {
      setToolNames({});
    }
  };

  // Busca usuários
  const fetchUsers = async () => {
    try {
      const response = await apiFetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (error) {
      setUsers([]);
    }
  };

  // Realiza atribuição
  const handleAssign = async () => {
    if (!selectedToolId || !selectedUserId || !quantity) {
      setErrorMsg("Selecione ferramenta, usuário e quantidade.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const response = await apiFetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tool_id: selectedToolId,
          user_id: selectedUserId,
          quantity: Number(quantity),
        }),
      });
      if (response.ok) {
        alert("Atribuição realizada com sucesso!");
        fetchTools(); // Atualiza lista após atribuição
      } else {
        alert("Erro ao atribuir ferramenta.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Atribuições</h2>
      <div>
        <label>Ferramenta:</label>
        <select
          value={selectedToolId}
          onChange={(e) => setSelectedToolId(e.target.value)}
        >
          <option value="">Selecione uma ferramenta</option>
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {toolNames[tool.id] || tool.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Quantidade:</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <div>
        <label>Usuário:</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">Selecione um usuário</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      {errorMsg && <div style={{ color: "red" }}>{errorMsg}</div>}
      <button onClick={handleAssign} disabled={loading}>
        {loading ? "Atribuindo..." : "Atribuir"}
      </button>
    </div>
  );
};

export default AssignmentsPage;