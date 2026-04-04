/* ═══════════════════════════════════════════════════════════════════════
   FYNEXT — API SERVER  |  server.js
   Node.js + Express · Proxy seguro para Gemini AI
   NEVER expõe a API key — toda IA passa por aqui
   ═══════════════════════════════════════════════════════════════════════ */

import express       from "express";
import cors          from "cors";
import helmet        from "helmet";
import rateLimit     from "express-rate-limit";
import dotenv        from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

/* ── VALIDAÇÃO ANTECIPADA ────────────────────────────────────────────── */
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("❌  API_KEY não encontrada no .env — abortando.");
  process.exit(1);
}

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const NODE_ENV = process.env.NODE_ENV ?? "development";

/* ── INSTÂNCIA GEMINI ────────────────────────────────────────────────── */
const ai = new GoogleGenAI({ apiKey: API_KEY });
console.log("✅  Gemini AI inicializado.");

/* ── SYSTEM PROMPT (server-side ONLY — nunca enviado ao cliente) ─────── */
const SYSTEM_PROMPT = `Você é o Finn, assistente virtual humanizado e especialista da Fynext — empresa premium de desenvolvimento de software em São Paulo, Brasil.

SOBRE A FYNEXT:
• 3 anos de mercado, 20+ projetos entregues, 98% de satisfação
• Especialidades: Sistemas ERP, Apps Mobile (iOS/Android), E-commerce, Dashboards BI, Sites institucionais, SaaS B2B
• Atuação em 12 setores — São Paulo, SP, Brasil
• E-mail de contato: contato@fynext.dev

PORTFÓLIO (cases reais):
• LogiControl ERP — redução de 74% em erros operacionais de logística
• FitTrack App — 1.200 usuários, nota 4.8 na App Store
• LuxeModa — e-commerce fashion com R$320k GMV mensal
• DataFlow Analytics — BI para 3 grupos de varejo em tempo real
• Prime Imóveis — portal imobiliário com +180% em leads em 60 dias
• ClienteHub CRM — SaaS B2B com 80+ empresas assinantes
• DeliveryGo — app de delivery, 31% menos tempo de entrega
• PetShopX — marketplace pet, R$180k GMV no 1º mês

SERVIÇOS E PREÇOS (estimativas orientativas):
• Site institucional / landing page: R$2.000–R$5.000 | 2–4 semanas
• E-commerce completo: R$6.000–R$25.000 | 4–8 semanas
• App Mobile (iOS+Android): R$40.000–R$100.000 | 15–35 semanas
• Sistema / ERP customizado: R$20.000–R$80.000+ | 12–24 semanas
• Dashboard BI: R$6.000–R$18.000 | 3–6 semanas
• SaaS B2B: a partir de R$25.000 | 12–20 semanas
Obs: valores são estimativas; orçamento final após briefing.

PROCESSO:
1. Reunião de briefing gratuita (30–60 min)
2. Proposta personalizada em até 24h
3. Desenvolvimento em sprints quinzenais com entregas parciais
4. Testes e ajustes com o cliente
5. Deploy + treinamento da equipe
6. Suporte pós-entrega de 30 dias incluído

REGRAS DE COMPORTAMENTO:
• Tom caloroso, profissional, direto — sem jargões desnecessários
• Respostas curtas (máx. 4–5 linhas), fluidas para chat
• Nunca use asteriscos, hashtags ou markdown — texto limpo apenas
• Quando não souber algo específico, seja honesto e ofereça encaminhar à equipe
• Para contato direto, sempre mencionar contato@fynext.dev
• Responda SEMPRE em português brasileiro.`;

/* ── APP ─────────────────────────────────────────────────────────────── */
const app = express();

/* ── SEGURANÇA: HEADERS HTTP ─────────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // gerenciado no front-end
}));

/* ── CORS ────────────────────────────────────────────────────────────── */
// Em produção, defina ALLOWED_ORIGINS no .env:
// ALLOWED_ORIGINS=https://fynext.site,https://www.fynext.site
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ?? "http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000"
)
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: curl, Postman) apenas em desenvolvimento
    // Sem origin: curl, Postman — só em dev
    if (!origin) {
      if (NODE_ENV === "production") {
        return callback(new Error("Origin obrigatório em produção."));
      }
      return callback(null, true);
    }
    // origin === "null" (string): browser abrindo HTML via file://
    // Permitido somente fora de produção
    if (origin === "null") {
      if (NODE_ENV === "production") {
        return callback(new Error("CORS: file:// não permitido em produção."));
      }
      return callback(null, true);
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS bloqueado: origin "${origin}" não permitida.`));
  },
  methods:        ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  maxAge:         600, // cache preflight por 10 min
}));

/* ── BODY PARSER (limite para prevenir ataques de payload gigante) ─────── */
app.use(express.json({ limit: "24kb" }));

/* ── RATE LIMITING ───────────────────────────────────────────────────── */
// 20 mensagens/minuto por IP — ajuste via env se necessário
const chatLimiter = rateLimit({
  windowMs:       60 * 1000,
  max:            parseInt(process.env.RATE_LIMIT_MAX ?? "20", 10),
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { reply: "Muitas mensagens em pouco tempo. Aguarde um momento e tente novamente. 🙏" },
});

/* ── CONSTANTES DE VALIDAÇÃO ─────────────────────────────────────────── */
const MAX_MESSAGE_LEN  = 1_000;  // caracteres por mensagem
const MAX_HISTORY_ITEMS = 20;    // máximo de turns no histórico
const MAX_HISTORY_TEXT = 2_000;  // caracteres por item de histórico

/* ── ROTA: POST /chat ────────────────────────────────────────────────── */
app.post("/chat", chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body ?? {};

    /* Validação da mensagem principal */
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ reply: "Mensagem inválida ou vazia." });
    }
    if (message.length > MAX_MESSAGE_LEN) {
      return res.status(400).json({
        reply: `Mensagem muito longa. Limite: ${MAX_MESSAGE_LEN} caracteres.`,
      });
    }

    /* Validação e sanitização do histórico enviado pelo cliente */
    const safeHistory = Array.isArray(history)
      ? history
          .slice(-MAX_HISTORY_ITEMS)
          .filter(
            entry =>
              entry &&
              typeof entry === "object" &&
              ["user", "model"].includes(entry.role) &&
              Array.isArray(entry.parts) &&
              entry.parts.length > 0 &&
              entry.parts.every(
                p => p && typeof p.text === "string" && p.text.length > 0,
              ),
          )
          .map(entry => ({
            role:  entry.role,
            parts: entry.parts.map(p => ({
              text: String(p.text).slice(0, MAX_HISTORY_TEXT),
            })),
          }))
      : [];

    /* Monta os contents — system prompt injetado server-side (invisível ao cliente) */
    const contents = [
      { role: "user",  parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Entendido! Estou pronto para atender como Finn, o assistente da Fynext. Pode perguntar!" }] },
      ...safeHistory,
      { role: "user",  parts: [{ text: message.trim() }] },
    ];

    /* Chamada ao Gemini */
    const response = await ai.models.generateContent({
      model:   "gemini-1.5-flash",
      contents,
      generationConfig: {
        temperature:      0.75,
        maxOutputTokens:  512,
        topP:             0.9,
      },
    });

    /* Extrai e sanitiza a resposta (remove markdown acidental) */
    const rawReply = response.text ?? "";
    const cleanReply = rawReply
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g,    "$1")
      .replace(/#{1,6}\s/g,     "")
      .trim();

    if (!cleanReply) {
      return res.status(502).json({
        reply: "Não consegui gerar uma resposta. Pode tentar novamente? 🙏",
      });
    }

    res.json({ reply: cleanReply });

  } catch (err) {
    /* Log detalhado apenas no servidor, nunca expõe stack ao cliente */
    console.error("❌  Erro Gemini:", err?.message ?? err);
    res.status(500).json({
      reply: "Serviço temporariamente indisponível. Tente novamente em breve ou escreva para contato@fynext.dev",
    });
  }
});

/* ── ROTAS DESCONHECIDAS ─────────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

/* ── START ───────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀  Servidor Fynext rodando em http://localhost:${PORT}  [${NODE_ENV}]`);
  console.log(`🔒  CORS permitido para: ${ALLOWED_ORIGINS.join(", ")}`);
});