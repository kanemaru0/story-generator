export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { genre, ambience, structure, keywords, audience, length, format } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'OpenAI API キーが設定されていません。' });
  }

  const basePrompt = `
あなたはプロの物語作成AIです。次の条件に沿ったストーリーを日本語で生成してください。

【ジャンル】${genre}
【雰囲気・テンション】${ambience}
【構造形式】${structure}
【キーワード・トリガー語】${keywords}
【読者層】${audience}
【文字数の目安】${length}
【形式】${format}

ストーリー開始：
`;

  // max_tokens 設定
  let maxTokens = 3000;
  if (length.includes('中編')) {
    maxTokens = 4000;
  } else if (length.includes('短編')) {
    maxTokens = 3000;
  } else if (length.includes('長編')) {
    maxTokens = 3500; // 長編は分割生成のため各パート3500程度
  }

  try {
    let generatedStory = '';

    if (length.includes('長編')) {
      // 分割生成: パート1
      const part1 = await generatePart(apiKey, basePrompt + '第一部を始めてください。', maxTokens);
      generatedStory += part1;

      // 分割生成: パート2
      const part2 = await generatePart(apiKey, basePrompt + '第二部として続けてください。前のストーリーの続きです。', maxTokens);
      generatedStory += '\n\n' + part2;

      // 必要ならさらに分割（10,000字を超える場合はさらにパートを追加可能）
    } else {
      // 短編・中編は一括生成
      generatedStory = await generatePart(apiKey, basePrompt, maxTokens);
    }

    if (!generatedStory) {
      return res.status(500).json({ message: '物語生成に失敗しました。' });
    }

    // 矛盾チェック
    const checkPrompt = `
次の物語の中で以下の矛盾を検出し、あれば指摘してください。
・構造矛盾（ジャンルとテンションの食い違い）
・トーン矛盾（キャラ設定やテーマと文体テンションの不一致）
・ロジック矛盾（死亡／別れ／壊れた要素の復活）
・キーワード間矛盾
・時系列矛盾

物語：
${generatedStory}

結果はJSON形式で出力し、形式は以下としてください：
{
  "構造矛盾": "（内容または 'なし'）",
  "トーン矛盾": "（内容または 'なし'）",
  "ロジック矛盾": "（内容または 'なし'）",
  "キーワード間矛盾": "（内容または 'なし'）",
  "時系列矛盾": "（内容または 'なし'）"
}
`;

    const check = await generatePart(apiKey, checkPrompt, 1000, "物語の矛盾検出AI");

    let parsedCheck;
    try {
      parsedCheck = JSON.parse(check);
    } catch (e) {
      parsedCheck = { raw: check };
    }

    return res.status(200).json({
      story: generatedStory,
      check: parsedCheck
    });

  } catch (error) {
    console.error("物語生成エラー:", error);
    return res.status(500).json({ message: '物語生成中にエラーが発生しました。' });
  }
}

// 共通の生成関数
async function generatePart(apiKey, prompt, maxTokens, systemRole = "あなたはプロの物語作成AIです。") {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemRole },
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
