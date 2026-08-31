import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// ============= KV STORE =============

const supabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const kvGet = async (key: string): Promise<any> => {
  const supabase = supabaseClient();
  const { data, error } = await supabase.from("kv_store_37144efb").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

const kvSet = async (key: string, value: any): Promise<void> => {
  const supabase = supabaseClient();
  const { error } = await supabase.from("kv_store_37144efb").upsert({ key, value });
  if (error) throw new Error(error.message);
};

const kvDel = async (key: string): Promise<void> => {
  const supabase = supabaseClient();
  const { error } = await supabase.from("kv_store_37144efb").delete().eq("key", key);
  if (error) throw new Error(error.message);
};

const kvGetByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = supabaseClient();
  const { data, error } = await supabase.from("kv_store_37144efb").select("key, value").like("key", prefix + "%");
  if (error) throw new Error(error.message);
  return data?.map((d) => d.value) ?? [];
};

// ============= HONO APP =============

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Prefixo das rotas
const PREFIX = "/make-server-37144efb";

// Health check endpoint
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Root endpoint
app.get(`${PREFIX}/`, (c) => {
  return c.json({ 
    status: "ok", 
    message: "Nicolina API Server",
    version: "1.0.0",
    endpoints: [`${PREFIX}/encomendas`, `${PREFIX}/produtos`, `${PREFIX}/clientes`, `${PREFIX}/backup`, `${PREFIX}/backups`]
  });
});

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Nicolina API Server",
    version: "1.0.0",
    endpoints: [`${PREFIX}/encomendas`, `${PREFIX}/produtos`, `${PREFIX}/clientes`, `${PREFIX}/backup`, `${PREFIX}/backups`]
  });
});

// ============= ENCOMENDAS =============

// Listar todas as encomendas
app.get(`${PREFIX}/encomendas`, async (c) => {
  try {
    console.log("Iniciando busca de encomendas...");
    const encomendas = await kvGetByPrefix("encomenda:");
    console.log(`Encontradas ${encomendas.length} encomendas`);
    return c.json({ success: true, data: encomendas });
  } catch (error) {
    console.log(`Erro ao listar encomendas: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar encomenda por ID
app.get(`${PREFIX}/encomendas/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const encomenda = await kvGet(`encomenda:${id}`);
    if (!encomenda) {
      return c.json({ success: false, error: "Encomenda não encontrada" }, 404);
    }
    return c.json({ success: true, data: encomenda });
  } catch (error) {
    console.log(`Erro ao buscar encomenda: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Criar encomenda
app.post(`${PREFIX}/encomendas`, async (c) => {
  try {
    const body = await c.req.json();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const encomenda = {
      id,
      ...body,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await kvSet(`encomenda:${id}`, encomenda);
    return c.json({ success: true, data: encomenda });
  } catch (error) {
    console.log(`Erro ao criar encomenda: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Atualizar encomenda
app.put(`${PREFIX}/encomendas/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const encomendaExistente = await kvGet(`encomenda:${id}`);
    if (!encomendaExistente) {
      return c.json({ success: false, error: "Encomenda não encontrada" }, 404);
    }
    const encomendaAtualizada = {
      ...encomendaExistente,
      ...body,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    await kvSet(`encomenda:${id}`, encomendaAtualizada);
    return c.json({ success: true, data: encomendaAtualizada });
  } catch (error) {
    console.log(`Erro ao atualizar encomenda: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Excluir encomenda
app.delete(`${PREFIX}/encomendas/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    await kvDel(`encomenda:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Erro ao excluir encomenda: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============= PRODUTOS =============

// Listar todos os produtos
app.get(`${PREFIX}/produtos`, async (c) => {
  try {
    const produtos = await kvGetByPrefix("produto:");
    return c.json({ success: true, data: produtos });
  } catch (error) {
    console.log(`Erro ao listar produtos: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar produto por ID
app.get(`${PREFIX}/produtos/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const produto = await kvGet(`produto:${id}`);
    if (!produto) {
      return c.json({ success: false, error: "Produto não encontrado" }, 404);
    }
    return c.json({ success: true, data: produto });
  } catch (error) {
    console.log(`Erro ao buscar produto: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Criar produto
app.post(`${PREFIX}/produtos`, async (c) => {
  try {
    const body = await c.req.json();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const produto = {
      id,
      ...body,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await kvSet(`produto:${id}`, produto);
    return c.json({ success: true, data: produto });
  } catch (error) {
    console.log(`Erro ao criar produto: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Atualizar produto
app.put(`${PREFIX}/produtos/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const produtoExistente = await kvGet(`produto:${id}`);
    if (!produtoExistente) {
      return c.json({ success: false, error: "Produto não encontrado" }, 404);
    }
    const produtoAtualizado = {
      ...produtoExistente,
      ...body,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    await kvSet(`produto:${id}`, produtoAtualizado);
    return c.json({ success: true, data: produtoAtualizado });
  } catch (error) {
    console.log(`Erro ao atualizar produto: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Excluir produto
app.delete(`${PREFIX}/produtos/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    await kvDel(`produto:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Erro ao excluir produto: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============= CLIENTES =============

// Listar todos os clientes
app.get(`${PREFIX}/clientes`, async (c) => {
  try {
    const clientes = await kvGetByPrefix("cliente:");
    return c.json({ success: true, data: clientes });
  } catch (error) {
    console.log(`Erro ao listar clientes: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar cliente por ID
app.get(`${PREFIX}/clientes/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const cliente = await kvGet(`cliente:${id}`);
    if (!cliente) {
      return c.json({ success: false, error: "Cliente não encontrado" }, 404);
    }
    return c.json({ success: true, data: cliente });
  } catch (error) {
    console.log(`Erro ao buscar cliente: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Criar cliente
app.post(`${PREFIX}/clientes`, async (c) => {
  try {
    const body = await c.req.json();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const cliente = {
      id,
      ...body,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await kvSet(`cliente:${id}`, cliente);
    return c.json({ success: true, data: cliente });
  } catch (error) {
    console.log(`Erro ao criar cliente: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Atualizar cliente
app.put(`${PREFIX}/clientes/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const clienteExistente = await kvGet(`cliente:${id}`);
    if (!clienteExistente) {
      return c.json({ success: false, error: "Cliente não encontrado" }, 404);
    }
    const clienteAtualizado = {
      ...clienteExistente,
      ...body,
      id,
      atualizadoEm: new Date().toISOString(),
    };
    await kvSet(`cliente:${id}`, clienteAtualizado);
    return c.json({ success: true, data: clienteAtualizado });
  } catch (error) {
    console.log(`Erro ao atualizar cliente: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Excluir cliente
app.delete(`${PREFIX}/clientes/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    await kvDel(`cliente:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Erro ao excluir cliente: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============= BACKUP =============

// Criar backup manual
app.post(`${PREFIX}/backup`, async (c) => {
  try {
    const timestamp = Date.now();
    const encomendas = await kvGetByPrefix("encomenda:");
    const produtos = await kvGetByPrefix("produto:");
    const clientes = await kvGetByPrefix("cliente:");
    
    const backup = {
      timestamp,
      data: new Date().toISOString(),
      encomendas,
      produtos,
      clientes,
    };
    
    await kvSet(`backup:${timestamp}`, backup);
    return c.json({ success: true, data: backup });
  } catch (error) {
    console.log(`Erro ao criar backup: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Listar backups
app.get(`${PREFIX}/backups`, async (c) => {
  try {
    const backups = await kvGetByPrefix("backup:");
    return c.json({ success: true, data: backups });
  } catch (error) {
    console.log(`Erro ao listar backups: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar backup específico
app.get(`${PREFIX}/backups/:timestamp`, async (c) => {
  try {
    const timestamp = c.req.param("timestamp");
    const backup = await kvGet(`backup:${timestamp}`);
    if (!backup) {
      return c.json({ success: false, error: "Backup não encontrado" }, 404);
    }
    return c.json({ success: true, data: backup });
  } catch (error) {
    console.log(`Erro ao buscar backup: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Restaurar backup
app.post(`${PREFIX}/backups/:timestamp/restore`, async (c) => {
  try {
    const timestamp = c.req.param("timestamp");
    const backup = await kvGet(`backup:${timestamp}`);
    if (!backup) {
      return c.json({ success: false, error: "Backup não encontrado" }, 404);
    }

    // Restaurar encomendas
    if (backup.encomendas && Array.isArray(backup.encomendas)) {
      for (const encomenda of backup.encomendas) {
        await kvSet(`encomenda:${encomenda.id}`, encomenda);
      }
    }

    // Restaurar produtos
    if (backup.produtos && Array.isArray(backup.produtos)) {
      for (const produto of backup.produtos) {
        await kvSet(`produto:${produto.id}`, produto);
      }
    }

    // Restaurar clientes
    if (backup.clientes && Array.isArray(backup.clientes)) {
      for (const cliente of backup.clientes) {
        await kvSet(`cliente:${cliente.id}`, cliente);
      }
    }

    return c.json({ success: true, message: "Backup restaurado com sucesso" });
  } catch (error) {
    console.log(`Erro ao restaurar backup: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Servir o app
Deno.serve((req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  return app.fetch(req);
});