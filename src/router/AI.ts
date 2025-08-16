import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router, Request, Response } from 'express';

const router = Router();

//型設定
interface AdviceRequestBody {
  sleeping_score: number;
  con_score: number;
  sleeping_time: number;
}

// Gemini 初期化
const apiKey = process.env.GOOGLE_API_KEY!;
if (!apiKey) throw new Error('GOOGLE_API_KEY is missing');

const modelName = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: modelName });

// POST /api/ai
router.post('/', async (req: Request<{}, {}, AdviceRequestBody>, res: Response) =>  {
  try {
    const { sleeping_score, con_score, sleeping_time } = req.body;

    // 簡易チェック
    if (
      typeof sleeping_score !== 'number' ||
      typeof con_score !== 'number' ||
      typeof sleeping_time !== 'number'
    ) {
      return res.status(400).json({ error: 'invalid_payload' });
    }

        const prompt = `
        あなたは短く励ましつつも少し厳しめの睡眠コーチです。
        昼間に眠くなりがちな学生向けに、日本語で80文字以内の一言アドバイスを返してください。
        説教臭くしすぎず、改善点を明確にし、前向きな気持ちになるようにしてください。
        絵文字は使わない。
        入力: 睡眠時間=${sleeping_time}h, 日中の眠気度合い(1-5)=${sleeping_score}, 集中度(1-5)=${con_score}
        `;

    const result = await model.generateContent(prompt);
    const message = result.response.text().trim();

    res.json({ message });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'ai_error' });
  }
});

export default router;