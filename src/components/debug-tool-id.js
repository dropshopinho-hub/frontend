// Script temporário para depuração do id das ferramentas
export function debugToolIds(tools) {
  return tools.map(tool => ({
    name: tool.name,
    id: tool.id,
    _id: tool._id,
    full: tool
  }));
}
