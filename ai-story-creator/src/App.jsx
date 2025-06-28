import { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [story, setStory] = useState('');

  const generateStory = () => {
    if (!input) return;
    setStory(`あなたのキーワード「${input}」に基づく物語がここに生成されます。むかしむかし...`);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>AI物語ジェネレーター</h1>
      <input
        type="text"
        placeholder="キーワードを入力"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ padding: '0.5rem', width: '80%' }}
      />
      <button onClick={generateStory} style={{ marginLeft: '1rem', padding: '0.5rem' }}>
        作成
      </button>
      {story && (
        <div style={{ marginTop: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
          <p>{story}</p>
        </div>
      )}
    </div>
  );
}

export default App;
