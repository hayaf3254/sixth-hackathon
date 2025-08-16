import { Pool, PoolClient } from 'pg';

// データベース設定
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sleep_coach',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// データベースプールの作成
const pool = new Pool(dbConfig);

// データベース接続テスト
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ データベース接続成功');
    return true;
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    return false;
  }
};

// データベースクライアントの取得
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// データベースプールの終了
export const closePool = async (): Promise<void> => {
  await pool.end();
};

// データベース初期化（テーブル作成）
export const initializeDatabase = async (): Promise<void> => {
  try {
    const client = await getClient();
    
    // SQLファイルの内容を実行
    const sql = `
      -- ユーザーテーブル
      CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- スコアテーブル
      CREATE TABLE IF NOT EXISTS scores (
          score_id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(user_id),
          sleeping_score INTEGER NOT NULL CHECK (sleeping_score >= 1 AND sleeping_score <= 5),
          con_score INTEGER NOT NULL CHECK (con_score >= 1 AND con_score <= 5),
          sleeping_time DECIMAL(3,1) NOT NULL CHECK (sleeping_time >= 0 AND sleeping_time <= 24),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- AIメッセージテーブル
      CREATE TABLE IF NOT EXISTS ai_messages (
          message_id SERIAL PRIMARY KEY,
          score_id INTEGER NOT NULL REFERENCES scores(score_id),
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- インデックスの作成
      CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_messages_score_id ON ai_messages(score_id);
    `;
    
    await client.query(sql);
    
    // サンプルデータの挿入
    await client.query(`
      INSERT INTO users (username, password) VALUES 
      ('testuser', 'password123')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    // 過去7日分のサンプルデータ
    await client.query(`
      INSERT INTO scores (user_id, sleeping_score, con_score, sleeping_time, created_at) VALUES
      (1, 3, 4, 7.5, CURRENT_TIMESTAMP - INTERVAL '6 days'),
      (1, 2, 5, 8.0, CURRENT_TIMESTAMP - INTERVAL '5 days'),
      (1, 4, 3, 6.5, CURRENT_TIMESTAMP - INTERVAL '4 days'),
      (1, 1, 5, 8.5, CURRENT_TIMESTAMP - INTERVAL '3 days'),
      (1, 3, 4, 7.0, CURRENT_TIMESTAMP - INTERVAL '2 days'),
      (1, 2, 5, 7.8, CURRENT_TIMESTAMP - INTERVAL '1 day'),
      (1, 3, 4, 7.2, CURRENT_TIMESTAMP)
      ON CONFLICT DO NOTHING;
    `);
    
    client.release();
    console.log('✅ データベース初期化完了');
  } catch (error) {
    console.error('❌ データベース初期化エラー:', error);
    throw error;
  }
};

export default pool; 