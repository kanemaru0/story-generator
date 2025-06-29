export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { genre, ambience, structure, keywords, audience, length, format, previousStory, part } = req.body;
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

  const maxTokens = 3500;
  let prompt = '';

  if (previousStory) {
    prompt = `${previousStory}\n\n第${part}部として前のストーリーの続きです。目安の部数を超えている場合でも希望に応じて物語を進めてください。`;
  } else {
    prompt = basePrompt + `第${part}部として物語を開始してください。`;
  }

  try {
    const generatedStory = await generatePart(apiKey, prompt, maxTokens);

    if (!generatedStory) {
      return res.status(500).json({ message: '物語生成に失敗しました。' });
    }

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

    const checkRaw = await generatePart(apiKey, checkPrompt, 1000, "物語の矛盾検出AI");
    let parsedCheck = {};
    try {
      parsedCheck = JSON.parse(checkRaw);
    } catch {
      parsedCheck = { raw: checkRaw };
    }

    return res.status(200).json({
      story: generatedStory,
      check: parsedCheck
    });

  } catch (err) {
    console.error("物語生成エラー:", err);
    return res.status(500).json({ message: '物語生成中にエラーが発生しました。' });
  }
}

async function generatePart(apiKey, prompt, maxTokens, systemRole = "あなたはプロの物語作成AIです。") {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
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
