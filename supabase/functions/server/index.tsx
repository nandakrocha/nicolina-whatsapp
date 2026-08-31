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

const app = new Hono().basePath('/make-server-00d5eece');

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

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Root endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Nicolina API Server",
    version: "1.0.0",
    endpoints: ["/encomendas", "/produtos", "/clientes", "/backup", "/backups"]
  });
});

// ============= ENCOMENDAS =============

// Listar todas as encomendas
app.get("/encomendas", async (c) => {
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
app.get("/encomendas/:id", async (c) => {
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
app.post("/encomendas", async (c) => {
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
app.put("/encomendas/:id", async (c) => {
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
app.delete("/encomendas/:id", async (c) => {
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
app.get("/produtos", async (c) => {
  try {
    const produtos = await kvGetByPrefix("produto:");
    return c.json({ success: true, data: produtos });
  } catch (error) {
    console.log(`Erro ao listar produtos: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar produto por ID
app.get("/produtos/:id", async (c) => {
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
app.post("/produtos", async (c) => {
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
app.put("/produtos/:id", async (c) => {
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
app.delete("/produtos/:id", async (c) => {
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
app.get("/clientes", async (c) => {
  try {
    const clientes = await kvGetByPrefix("cliente:");
    return c.json({ success: true, data: clientes });
  } catch (error) {
    console.log(`Erro ao listar clientes: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar cliente por ID
app.get("/clientes/:id", async (c) => {
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
app.post("/clientes", async (c) => {
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
app.put("/clientes/:id", async (c) => {
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
app.delete("/clientes/:id", async (c) => {
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
app.post("/backup", async (c) => {
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
app.get("/backups", async (c) => {
  try {
    const backups = await kvGetByPrefix("backup:");
    return c.json({ success: true, data: backups });
  } catch (error) {
    console.log(`Erro ao listar backups: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Buscar backup específico
app.get("/backups/:timestamp", async (c) => {
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
app.post("/backups/:timestamp/restore", async (c) => {
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

// Enviar backup por email (automático)
app.post("/backup/send-email", async (c) => {
  try {
    const body = await c.req.json();
    const { email, backupData } = body;

    console.log(`📧 [BACKUP AUTOMÁTICO] Iniciando envio para: ${email}`);

    if (!email) {
      return c.json({ success: false, error: "Email não configurado" }, 400);
    }

    if (!backupData) {
      return c.json({ success: false, error: "Dados do backup não fornecidos" }, 400);
    }

    const dados = backupData;
    const dataFormatada = new Date(dados.timestamp).toLocaleDateString("pt-BR");
    const horaFormatada = new Date(dados.timestamp).toLocaleTimeString("pt-BR");
    const backupJson = JSON.stringify(dados, null, 2);
    const filename = `backup_nicolina_${dataFormatada.replace(/\//g, '-')}.json`;

    // Verificar se há chave da API Resend configurada
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log(`⚠️ [BACKUP AUTOMÁTICO] RESEND_API_KEY não configurada`);
      return c.json({ 
        success: false, 
        error: "Serviço de email não configurado. Configure RESEND_API_KEY nas variáveis de ambiente." 
      }, 500);
    }

    // Enviar email usando Resend
    console.log(`📤 [BACKUP AUTOMÁTICO] Enviando via Resend...`);
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #084d6e; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
    .stats { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #084d6e; }
    .stats h3 { margin-top: 0; color: #084d6e; }
    .stats ul { list-style: none; padding: 0; margin: 10px 0; }
    .stats li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .stats li:last-child { border-bottom: none; }
    .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    .btn { display: inline-block; background: #084d6e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>�� Backup Automático Nicolina</h1>
      <p>Sistema de Gestão de Encomendas</p>
    </div>
    <div class="content">
      <p>📅 <strong>Data do Backup:</strong> ${dataFormatada} às ${horaFormatada}</p>
      
      <div class="stats">
        <h3>📊 Resumo dos Dados Salvos</h3>
        <ul>
          <li>📦 <strong>${dados.encomendas?.length || 0}</strong> encomendas</li>
          <li>🍞 <strong>${dados.produtos?.length || 0}</strong> produtos cadastrados</li>
          <li>👥 <strong>${dados.clientes?.length || 0}</strong> clientes</li>
        </ul>
      </div>

      <div class="info-box">
        <strong>📎 Arquivo Anexado:</strong> ${filename}
        <br><br>
        O backup completo do sistema está anexado a este email em formato JSON.
        Guarde este arquivo em local seguro.
      </div>
      
      <h3>🔄 Como Restaurar Este Backup:</h3>
      <ol>
        <li>Acesse o sistema Nicolina</li>
        <li>Vá no menu lateral em <strong>"Backup e Restauração"</strong></li>
        <li>Clique em <strong>"Restaurar"</strong></li>
        <li>Selecione o arquivo JSON anexado neste email</li>
        <li>Confirme a restauração</li>
      </ol>

      <div class="footer">
        <p>✅ Este é um backup automático do sistema Nicolina</p>
        <p>🔒 Mantenha este email e o arquivo em local seguro</p>
        <p style="margin-top: 15px; color: #999;">Não responda este email - é enviado automaticamente</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nicolina Backup <onboarding@resend.dev>",
        to: [email],
        subject: `🍞 Backup Automático Nicolina - ${dataFormatada}`,
        html: emailHtml,
        attachments: [
          {
            filename: filename,
            content: Buffer.from(backupJson).toString('base64'),
          },
        ],
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error(`❌ [BACKUP AUTOMÁTICO] Erro ao enviar email:`, errorText);
      return c.json({ 
        success: false, 
        error: `Falha ao enviar email: ${errorText}` 
      }, 500);
    }

    const result = await resendResponse.json();
    console.log(`✅ [BACKUP AUTOMÁTICO] Email enviado com sucesso! ID: ${result.id}`);

    return c.json({ 
      success: true, 
      message: `Backup enviado com sucesso para ${email}`,
      emailId: result.id,
      stats: {
        encomendas: dados.encomendas?.length || 0,
        produtos: dados.produtos?.length || 0,
        clientes: dados.clientes?.length || 0,
      }
    });
  } catch (error) {
    console.error(`❌ [BACKUP AUTOMÁTICO] Erro:`, error);
    return c.json({ 
      success: false, 
      error: `Erro ao processar backup: ${String(error)}` 
    }, 500);
  }
});

// Servir o app
Deno.serve((req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  return app.fetch(req);
});