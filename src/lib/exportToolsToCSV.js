import Papa from 'papaparse';

export function exportToolsToCSV(tools, columns, filename = 'ferramentas.csv') {
  const data = tools.map(tool => ({
    'Nome da Ferramenta': tool.name,
    'Quantidade': tool.quantity,
    'Usuário': tool.username || '-',
    'Data de Atribuição': tool.assigned_at ? new Date(tool.assigned_at).toLocaleDateString('pt-BR') : '-',
    'Status': tool.status || 'Disponível'
  }));
  const csv = Papa.unparse({ fields: columns, data });
  // Adiciona BOM para garantir acentuação correta no Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
