const BASE = "/api/compromissos";

async function request(url, options) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao comunicar com o servidor.");
    return data;
}

export const listar = () => request(BASE);
export const criar = (item) => request(BASE, { method: "POST", body: JSON.stringify(item) });
export const atualizar = (id, item) => request(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(item) });
export const remover = (id) => request(`${BASE}/${id}`, { method: "DELETE" });
