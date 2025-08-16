import 'dotenv/config';
import { Pool, PoolConfig } from 'pg';

// .envから接続情報を設定
const config: PoolConfig = {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
};

export const pool = new Pool(config);

// クエリを簡単に呼べる関数
export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  return pool.query<T>(text, params);
}

// アプリ終了時にDBを閉じる
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
