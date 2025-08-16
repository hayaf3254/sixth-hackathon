// AIメッセージ生成サービス
export interface ScoreData {
  sleeping_score: number;  // 日中の眠気度 (1-5)
  con_score: number;       // 集中度 (1-5)
  sleeping_time: number;   // 睡眠時間 (時間)
}

export interface AIMessage {
  message: string;
  category: 'sleep' | 'concentration' | 'overall';
  priority: 'high' | 'medium' | 'low';
}

export class AIService {
  
  // 睡眠スコアに基づくメッセージ生成
  private generateSleepMessage(sleepingScore: number, sleepingTime: number): string {
    if (sleepingScore <= 2 && sleepingTime >= 7) {
      return "睡眠時間は十分ですが、睡眠の質に問題がある可能性があります。就寝前のルーティーンを見直してみましょう。";
    } else if (sleepingScore <= 2 && sleepingTime < 7) {
      return "睡眠不足が眠気の原因です。最低7時間の睡眠を目標に、就寝時間を早めることをお勧めします。";
    } else if (sleepingScore >= 4 && sleepingTime < 6) {
      return "睡眠時間が短いにも関わらず眠気が少ないのは良い兆候です。ただし、長期的には7-8時間の睡眠を心がけましょう。";
    } else if (sleepingScore >= 4 && sleepingTime >= 7) {
      return "睡眠の質が良好です！この調子で睡眠習慣を維持しましょう。";
    } else {
      return "睡眠の質と時間のバランスが取れています。現在の習慣を継続してください。";
    }
  }

  // 集中度に基づくメッセージ生成
  private generateConcentrationMessage(conScore: number, sleepingTime: number): string {
    if (conScore <= 2 && sleepingTime < 6) {
      return "睡眠不足が集中力の低下を引き起こしています。睡眠時間を増やすことで改善が期待できます。";
    } else if (conScore <= 2 && sleepingTime >= 7) {
      return "睡眠時間は十分ですが、集中力が低い状態です。朝のルーティーンや運動を取り入れてみましょう。";
    } else if (conScore >= 4 && sleepingTime >= 7) {
      return "集中力が高く、睡眠も十分です。理想的な状態を維持できています！";
    } else if (conScore >= 4 && sleepingTime < 6) {
      return "集中力は高いですが、睡眠時間が不足しています。長期的な健康のためにも睡眠時間を増やすことを検討してください。";
    } else {
      return "集中力は標準的なレベルです。睡眠と運動のバランスを保つことで、さらなる向上が期待できます。";
    }
  }

  // 総合的なアドバイス生成
  private generateOverallAdvice(sleepingScore: number, conScore: number, sleepingTime: number): string {
    const totalScore = sleepingScore + conScore;
    
    if (totalScore <= 4) {
      if (sleepingTime < 6) {
        return "睡眠時間の不足が主な問題です。まずは睡眠時間を7時間以上に増やすことを最優先にしてください。";
      } else {
        return "睡眠の質と集中力の両方に改善の余地があります。就寝前の習慣と朝のルーティーンを見直してみましょう。";
      }
    } else if (totalScore <= 7) {
      return "バランスの取れた状態です。小さな改善を積み重ねることで、さらなる向上が期待できます。";
    } else {
      return "非常に良い状態です！現在の習慣を維持し、定期的にモニタリングを続けましょう。";
    }
  }

  // メインのAIメッセージ生成メソッド
  public generateMessage(data: ScoreData): AIMessage {
    const sleepMessage = this.generateSleepMessage(data.sleeping_score, data.sleeping_time);
    const concentrationMessage = this.generateConcentrationMessage(data.con_score, data.sleeping_time);
    const overallAdvice = this.generateOverallAdvice(data.sleeping_score, data.con_score, data.sleeping_time);

    // 優先度の決定
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (data.sleeping_score <= 2 || data.con_score <= 2 || data.sleeping_time < 6) {
      priority = 'high';
    } else if (data.sleeping_score >= 4 && data.con_score >= 4 && data.sleeping_time >= 7) {
      priority = 'low';
    }

    // カテゴリの決定
    let category: 'sleep' | 'concentration' | 'overall' = 'overall';
    if (data.sleeping_score <= 2 || data.sleeping_time < 6) {
      category = 'sleep';
    } else if (data.con_score <= 2) {
      category = 'concentration';
    }

    const fullMessage = `${overallAdvice}\n\n【睡眠について】\n${sleepMessage}\n\n【集中力について】\n${concentrationMessage}`;

    return {
      message: fullMessage,
      category,
      priority
    };
  }

  // 過去のデータに基づく傾向分析
  public analyzeTrend(scores: ScoreData[]): string {
    if (scores.length < 3) {
      return "データが不足しているため、傾向分析はできません。";
    }

    const recentScores = scores.slice(-3);
    const avgSleepingScore = recentScores.reduce((sum, s) => sum + s.sleeping_score, 0) / recentScores.length;
    const avgConScore = recentScores.reduce((sum, s) => sum + s.con_score, 0) / recentScores.length;
    const avgSleepingTime = recentScores.reduce((sum, s) => sum + s.sleeping_time, 0) / recentScores.length;

    let trendMessage = "【最近3日間の傾向】\n";
    
    if (avgSleepingScore < 2.5) {
      trendMessage += "• 日中の眠気が継続的に高い状態です\n";
    } else if (avgSleepingScore > 3.5) {
      trendMessage += "• 日中の眠気は良好にコントロールされています\n";
    }

    if (avgConScore < 2.5) {
      trendMessage += "• 集中力が継続的に低い状態です\n";
    } else if (avgConScore > 3.5) {
      trendMessage += "• 集中力は良好に維持されています\n";
    }

    if (avgSleepingTime < 6.5) {
      trendMessage += "• 睡眠時間が継続的に不足しています\n";
    } else if (avgSleepingTime > 7.5) {
      trendMessage += "• 睡眠時間は十分に確保されています\n";
    }

    return trendMessage;
  }
}

export default new AIService(); 