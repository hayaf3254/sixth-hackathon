
class SleepCoachApp {
  constructor() {
    this.scores = []; // データを保存する配列
    this.chart = null; // Chart.jsのインスタンス
    this.init(); // 初期化
  }

  // アプリの初期化
  init() {
    this.loadSampleData(); // サンプルデータを読み込み
    this.setupEventListeners(); // イベントリスナーを設定
    this.renderChart(); // グラフを描画
    this.renderHistory(); // 履歴を描画
  }

  // サンプルデータを生成（デモ用）
  loadSampleData() {
    const today = new Date();
    this.scores = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      this.scores.push({
        id: i + 1,
        sleeping_score: Math.floor(Math.random() * 3) + 2, // 2-4のランダム値
        con_score: Math.floor(Math.random() * 3) + 2, // 2-4のランダム値
        sleeping_time: Math.floor(Math.random() * 3) + 6, // 6-8時間のランダム値
        date: date
      });
    }
  }

  // イベントリスナーを設定
  setupEventListeners() {
    // 送信ボタンのイベント
    document.getElementById('submit-btn').addEventListener('click', () => this.handleSubmit());
    
    // リセットボタンを動的に作成
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'データリセット';
    resetBtn.className = 'btn-reset';
    resetBtn.addEventListener('click', () => this.resetAllData());
    
    const formContainer = document.querySelector('.form-container');
    formContainer.appendChild(resetBtn);
  }

  // すべてのデータをリセット
  resetAllData() {
    if (confirm('すべてのデータをリセットしますか？この操作は取り消せません。')) {
      this.scores = [];
      this.renderChart();
      this.renderHistory();
      this.resetForm();
      alert('データがリセットされました。');
    }
  }

  // フォーム送信の処理
  async handleSubmit() {
    // 入力値を取得
    const sleepingScore = parseInt(document.getElementById('sleeping-score').value);
    const conScore = parseInt(document.getElementById('concentration').value);
    const sleepTime = parseFloat(document.getElementById('sleep-time').value);

    // 簡単なバリデーション
    if (!this.validateInputs(sleepingScore, conScore, sleepTime)) {
      alert('正しい値を入力してください。');
      return;
    }

    // 新しいスコアを作成
    const newScore = {
      id: this.scores.length + 1,
      sleeping_score: sleepingScore,
      con_score: conScore,
      sleeping_time: sleepTime,
      date: new Date()
    };

    this.scores.push(newScore);
    
    // バックエンドのAI APIを呼び出し（エラーハンドリングは簡素化）
    try {
      const aiResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleeping_score: sleepingScore,
          con_score: conScore,
          sleeping_time: sleepTime
        })
      });
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        this.displayAIResponse(aiData.message);
      } else {
        throw new Error('APIエラー');
      }
    } catch (error) {
      console.error('API呼び出しエラー:', error);
      // エラー時は簡単なメッセージを表示
      this.displayAIResponse('AIからのアドバイスを取得できませんでした。しばらく時間をおいて再度お試しください。');
    }
    
    this.resetForm();
    this.renderChart();
    this.renderHistory();
  }


  validateInputs(sleepingScore, conScore, sleepTime) {
    return sleepingScore >= 1 && sleepingScore <= 5 &&
           conScore >= 1 && conScore <= 5 &&
           sleepTime >= 0 && sleepTime <= 24;
  }

  // AIレスポンスを表示
  displayAIResponse(message) {
    const aiResponse = document.getElementById('ai-response');
    const aiMessage = document.getElementById('ai-message');
    aiMessage.textContent = message;
    aiResponse.style.display = 'block';
    aiResponse.scrollIntoView({ behavior: 'smooth' });
  }


  resetForm() {
    document.getElementById('sleeping-score').value = '3';
    document.getElementById('concentration').value = '3';
    document.getElementById('sleep-time').value = '7';
  }

  // グラフを描画
  renderChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    if (this.chart) this.chart.destroy();


    if (this.scores.length === 0) {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          }
        }
      });
      return;
    }


    const labels = this.scores.map(score => {
      const date = new Date(score.date);
      const today = new Date();
      const diffTime = Math.abs(today - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return '今日';
      if (diffDays === 1) return '昨日';
      if (diffDays === 2) return '2日前';
      if (diffDays === 3) return '3日前';
      if (diffDays === 4) return '4日前';
      if (diffDays === 5) return '5日前';
      if (diffDays === 6) return '6日前';
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    // グラフの設定//
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '😴 眠気度',
            data: this.scores.map(score => score.sleeping_score),
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
          },
          {
            label: '🎯 集中度',
            data: this.scores.map(score => score.con_score),
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.2)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
          },
          {
            label: '💤 睡眠時間',
            data: this.scores.map(score => score.sleeping_time),
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            borderWidth: 2,
            tension: 0.1,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (label.includes('睡眠時間')) {
                  return `${label}: ${value}時間`;
                }
                return `${label}: ${value}/5`;
              }
            }
          },
          legend: { position: 'top' }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          },
          y: { 
            beginAtZero: true, 
            max: 5,
            title: { text: '📊 スコア (1-5)' }
          },
          y1: { 
            type: 'linear', 
            display: true, 
            position: 'right', 
            beginAtZero: true, 
            max: 12,
            grid: { drawOnChartArea: false },
            title: { text: '⏰ 睡眠時間 (時間)' }
          }
        }
      }
    });
  }

  // 履歴を描画
  renderHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    // データがない場合
    if (this.scores.length === 0) {
      historyList.innerHTML = '<div class="no-data">データがありません。新しいデータを入力してください。</div>';
      return;
    }
    
    // 各スコアを表示
    this.scores.forEach(score => {
      const scoreElement = document.createElement('div');
      scoreElement.className = 'history-item';
      const date = new Date(score.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      
      scoreElement.innerHTML = `
        <div class="history-data">
          <div class="history-date">${dateStr}</div>
          <div class="history-scores">
            <span class="score-item">眠気度: ${score.sleeping_score}</span>
            <span class="score-item">集中度: ${score.con_score}</span>
            <span class="score-item">睡眠時間: ${score.sleeping_time}h</span>
          </div>
          <button class="btn-edit" onclick="app.showEditForm(${score.id})">編集</button>
        </div>
        <div class="edit-form" id="edit-form-${score.id}" style="display: none;">
          <div class="edit-inputs">
            <input type="number" id="edit-sleeping-${score.id}" value="${score.sleeping_score}" min="1" max="5">
            <input type="number" id="edit-con-${score.id}" value="${score.con_score}" min="1" max="5">
            <input type="number" id="edit-sleep-${score.id}" value="${score.sleeping_time}" step="0.5" min="0" max="24">
          </div>
          <div class="edit-buttons">
            <button class="btn-save" onclick="app.saveEdit(${score.id})">保存</button>
            <button class="btn-cancel" onclick="app.cancelEdit(${score.id})">キャンセル</button>
          </div>
        </div>
      `;
      historyList.appendChild(scoreElement);
    });
  }

  // 編集フォームを表示
  showEditForm(scoreId) {
    document.getElementById(`edit-form-${scoreId}`).style.display = 'block';
  }

  // 編集を保存
  async saveEdit(scoreId) {
    const score = this.scores.find(s => s.id === scoreId);
    if (!score) return;

    // 新しい値を取得
    const newSleepingScore = parseInt(document.getElementById(`edit-sleeping-${scoreId}`).value);
    const newConScore = parseInt(document.getElementById(`edit-con-${scoreId}`).value);
    const newSleepTime = parseFloat(document.getElementById(`edit-sleep-${scoreId}`).value);

    // バリデーション
    if (!this.validateInputs(newSleepingScore, newConScore, newSleepTime)) {
      alert('正しい値を入力してください。');
      return;
    }

    // 値を更新
    score.sleeping_score = newSleepingScore;
    score.con_score = newConScore;
    score.sleeping_time = newSleepTime;

    // 再描画
    this.renderChart();
    this.renderHistory();
    
    // TODO: 今後はバックエンドにPUTリクエストを送信する予定
    // const response = await fetch(`/api/scores/${scoreId}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(score)
    // });
  }

  // 編集をキャンセル
  cancelEdit(scoreId) {
    document.getElementById(`edit-form-${scoreId}`).style.display = 'none';
  }
}

// グローバル変数としてアプリインスタンスを作成
let app;

// DOM読み込み完了後にアプリを初期化
document.addEventListener('DOMContentLoaded', () => {
  app = new SleepCoachApp();
});

// TODO: 今後改善予定の機能
// - データの永続化（ローカルストレージ or データベース）
// - より美しいグラフデザイン
// - データのエクスポート機能
// - ユーザー認証
// - より詳細なAI分析
// - モバイルアプリ化