const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3001;
const HOST = "127.0.0.1";
const DATA_FILE = path.resolve(__dirname, "..", "data", "compromissos.json");
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const MAX_BODY = 16 * 1024;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".map": "application/json",
};

async function readAll() {
    try {
        return JSON.parse(await fs.promises.readFile(DATA_FILE, "utf8"));
    } catch (err) {
        if (err.code === "ENOENT") return [];
        throw err;
    }
}

async function writeAll(items) {
    await fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    await fs.promises.writeFile(tmp, JSON.stringify(items, null, 2) + "\n", "utf8");
    await fs.promises.rename(tmp, DATA_FILE);
}

// Serializa as escritas para evitar condições de corrida no arquivo.
let queue = Promise.resolve();
function mutate(fn) {
    const run = queue.then(async () => {
        const items = await readAll();
        const result = await fn(items);
        await writeAll(items);
        return result;
    });
    queue = run.catch(() => {});
    return run;
}

function validate(body) {
    const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
    const data = typeof body.data === "string" ? body.data : "";
    const hora = typeof body.hora === "string" ? body.hora : "";
    const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";

    if (!titulo || titulo.length > 120) return { error: "Título obrigatório (até 120 caracteres)." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) return { error: "Data inválida (AAAA-MM-DD)." };
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return { error: "Hora inválida (HH:MM)." };
    if (descricao.length > 500) return { error: "Descrição deve ter até 500 caracteres." };

    return { value: { titulo, data, hora, descricao } };
}

function send(res, status, payload) {
    const body = payload === undefined ? "" : JSON.stringify(payload);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(body);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on("data", (chunk) => {
            size += chunk.length;
            if (size > MAX_BODY) {
                reject(Object.assign(new Error("Corpo da requisição muito grande."), { status: 413 }));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
            } catch {
                reject(Object.assign(new Error("JSON inválido."), { status: 400 }));
            }
        });
        req.on("error", reject);
    });
}

async function handleApi(req, res, pathname) {
    const match = pathname.match(/^\/api\/compromissos(?:\/([\w-]+))?$/);
    if (!match) return send(res, 404, { error: "Rota não encontrada." });
    const id = match[1];

    if (req.method === "GET" && !id) {
        return send(res, 200, await readAll());
    }

    if (req.method === "POST" && !id) {
        const { value, error } = validate(await readBody(req));
        if (error) return send(res, 400, { error });
        const novo = await mutate((items) => {
            const item = { id: crypto.randomUUID(), ...value };
            items.push(item);
            return item;
        });
        return send(res, 201, novo);
    }

    if (req.method === "PUT" && id) {
        const { value, error } = validate(await readBody(req));
        if (error) return send(res, 400, { error });
        const atualizado = await mutate((items) => {
            const index = items.findIndex((item) => item.id === id);
            if (index === -1) return null;
            items[index] = { id, ...value };
            return items[index];
        });
        return atualizado ? send(res, 200, atualizado) : send(res, 404, { error: "Compromisso não encontrado." });
    }

    if (req.method === "DELETE" && id) {
        const removido = await mutate((items) => {
            const index = items.findIndex((item) => item.id === id);
            if (index === -1) return false;
            items.splice(index, 1);
            return true;
        });
        return removido ? send(res, 204) : send(res, 404, { error: "Compromisso não encontrado." });
    }

    return send(res, 405, { error: "Método não permitido." });
}

async function handleStatic(req, res, pathname) {
    if (req.method !== "GET") return send(res, 405, { error: "Método não permitido." });
    const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
    const file = path.resolve(DIST_DIR, relative);
    if (file !== DIST_DIR && !file.startsWith(DIST_DIR + path.sep)) return send(res, 403, { error: "Acesso negado." });

    try {
        const content = await fs.promises.readFile(file);
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
        res.end(content);
    } catch {
        send(res, 404, { error: "Arquivo não encontrado. Execute 'npm run build'." });
    }
}

const server = http.createServer(async (req, res) => {
    try {
        const { pathname } = new URL(req.url, `http://${HOST}`);
        if (pathname.startsWith("/api/")) await handleApi(req, res, pathname);
        else await handleStatic(req, res, pathname);
    } catch (err) {
        const status = err.status || 500;
        if (status === 500) console.error(err);
        if (!res.headersSent) send(res, status, { error: status === 500 ? "Erro interno." : err.message });
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Agenda disponível em http://${HOST}:${PORT} (dados em ${DATA_FILE})`);
});
