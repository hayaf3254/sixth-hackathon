import express from "express";
import path from "path";
import { query } from "./db";
import aiRouter from "./router/AI"; 
import dbOpeRouter from "./router/db_ope"; 

const app = express();
const PORT = process.env.PORT ?? 3000;

// 静的ファイル（生HTML/CSS/JS）を配信
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

// APIの例
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from TypeScript Node!" });
});


// DB接続確認
app.get('/api/health', async (_req, res) => {
  try {
    const r = await query<{ now: string }>('SELECT NOW() as now');
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});


app.get('/api/records', async (_req, res) => {
  try {
    const r = await query(
      `SELECT score_id, user_id, sleeping_score, con_score, sleeping_time
       FROM records
       ORDER BY score_id DESC
       LIMIT 10`
    );
    res.json(r.rows);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message ?? 'fetch_error' });
  }
});

app.use('/api/ai', aiRouter);
app.use('/router', dbOpeRouter);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
