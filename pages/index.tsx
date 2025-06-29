import { useState } from 'react';

interface CheckResult {
  構造矛盾?: string;
  トーン矛盾?: string;
  ロジック矛盾?: string;
  キーワード間矛盾?: string;
  時系列矛盾?: string;
  raw?: string;
}

export default function Home() {
  const [genre, setGenre] = useState('異世界転生・冒険ファンタジー系');
  const [ambience, setAmbience] = useState('');
  const [structure, setStructure] = useState('');
  const [keywords, setKeywords] = useState('');
  const [audience, setAudience] = useState('');
  const [length, setLength] = useState('');
  const [format, setFormat] = useState('');
  const [story, setStory] = useState('');
  const [check, setCheck] = useState<CheckResult>({});
  const [loading, setLoading] = useState(false);

  const [currentPart, setCurrentPart] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState('★★★★★');
  const [submittedReview, setSubmittedReview] = useState<{ rating: string; text: string } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setStory('');
    setCheck({});
    setCurrentPart(1);
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genre, ambience, structure, keywords, audience, length, format, part: 1
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (data.story) {
      setStory(data.story);
      setCheck(data.check);
    } else {
      setStory('物語生成に失敗しました。');
    }
  };

  const handleContinue = async () => {
    if (!story) {
      alert('まず物語を生成してください。');
      return;
    }
    setLoading(true);
    const nextPart = currentPart + 1;
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genre, ambience, structure, keywords, audience, length, format,
        previousStory: story,
        part: nextPart
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (data.story) {
      setStory(prev => prev + '\n\n' + data.story);
      setCheck(data.check);
      setCurrentPart(nextPart);
    } else {
      alert('続きを生成できませんでした。');
    }
  };

  const handleReviewSubmit = () => {
    setSubmittedReview({ rating: reviewRating, text: reviewText });
    setReviewText('');
  };

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>ストーリークリエイター</h1>
      <p>AIがあなたの条件に沿ったオリジナル物語を生成します。</p>

      <div>
        <label>ジャンル</label>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option>異世界転生・冒険ファンタジー系</option>
          <option>学園異能・頭脳バトル系</option>
          <option>恋愛・ハーレム・スローライフ系</option>
          <option>ダーク・復讐系</option>
          <option>スキル特化・クラフト／経済系</option>
          <option>悪役令嬢・乙女ゲーム系</option>
          <option>モブ主人公・勘違い最強系</option>
          <option>青春・成長（現代小説系）</option>
          <option>現代ホラー・ミステリー</option>
          <option>歴史・伝奇・薬屋型ミステリー</option>
        </select>
      </div>

      <div>
        <label>雰囲気・テンション</label>
        <select value={ambience} onChange={(e) => setAmbience(e.target.value)}>
          <option value="">選択してください</option>
          <option>明るい</option>
          <option>シリアス</option>
          <option>ダーク</option>
          <option>ギャグ調</option>
        </select>
      </div>

      <div>
        <label>構造形式</label>
        <select value={structure} onChange={(e) => setStructure(e.target.value)}>
          <option value="">選択してください</option>
          <option>三幕構成</option>
          <option>起承転結</option>
          <option>連作短編</option>
        </select>
      </div>

      <div>
        <label>キーワード・トリガー語</label>
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="例: 裏切り, ループ" />
      </div>

      <div>
        <label>読者層</label>
        <select value={audience} onChange={(e) => setAudience(e.target.value)}>
          <option value="">選択してください</option>
          <option>中高生男子</option>
          <option>中高生女子</option>
          <option>大学生男子</option>
          <option>大学生女子</option>
          <option>社会人</option>
        </select>
      </div>

      <div>
        <label>文字数の目安</label>
        <div>
          <input type="radio" name="length" value="短編（～3部）" onChange={(e) => setLength(e.target.value)} /> 短編（～3部）
          <input type="radio" name="length" value="中編（～4部）" onChange={(e) => setLength(e.target.value)} /> 中編（～4部）
          <input type="radio" name="length" value="長編（～5部）" onChange={(e) => setLength(e.target.value)} /> 長編（～5部）
          <input type="radio" name="length" value="自動最適化" onChange={(e) => setLength(e.target.value)} /> 自動最適化
        </div>
      </div>

      <div>
        <label>形式</label>
        <div>
          <input type="radio" name="format" value="会話形式" onChange={(e) => setFormat(e.target.value)} /> 会話形式
          <input type="radio" name="format" value="一括生成" onChange={(e) => setFormat(e.target.value)} /> 一括生成
          <input type="radio" name="format" value="自由記載" onChange={(e) => setFormat(e.target.value)} /> 自由記載
        </div>
      </div>

      <div style={{ margin: '10px 0' }}>
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? '生成中...' : '物語を生成する'}
        </button>
      </div>

      <h2>📘 生成された物語</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{story}</pre>

      <h2>🔍 矛盾チェック</h2>
      <div>
        構造矛盾: {check.構造矛盾 || 'なし'}<br />
        トーン矛盾: {check.トーン矛盾 || 'なし'}<br />
        ロジック矛盾: {check.ロジック矛盾 || 'なし'}<br />
        キーワード間矛盾: {check.キーワード間矛盾 || 'なし'}<br />
        時系列矛盾: {check.時系列矛盾 || 'なし'}
      </div>

      <h2>⭐ ユーザーレビュー</h2>
      <div>
        <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>
          <option>★★★★★</option>
          <option>★★★★</option>
          <option>★★★</option>
          <option>★★</option>
          <option>★</option>
        </select>
      </div>
      <textarea
        placeholder="感想をお書きください"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
      ></textarea>
      <button onClick={handleReviewSubmit}>レビューを投稿する</button>

      {submittedReview && (
        <div>
          <h3>投稿されたレビュー</h3>
          <p>評価: {submittedReview.rating}</p>
          <p>コメント: {submittedReview.text}</p>
          <p style={{ color: 'gray', fontSize: 'small' }}>※簡易保存なのでリロードで消えます</p>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? '生成中...' : '再生成'}
        </button>
        <button onClick={() => location.reload()}>別の物語を作成（TOPへ戻る）</button>
        <button onClick={handleContinue} disabled={loading}>続きを生成する ➤➤➤</button>
      </div>
    </main>
  );
}
