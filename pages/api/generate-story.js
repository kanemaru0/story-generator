export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { genre, ambience, structure, keywords, audience, length, format, previousStory, currentPart } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'OpenAI API キーが設定されていません。' });
  }

  // 部数上限判定
  const getMaxPart = () => {
    if (length.includes('短編')) return 3;
    if (length.includes('中編')) return 4;
    if (length.includes('長編')) return 5;
    return 5;
  };

  const partNumber = currentPart || 1;
  const maxPart = getMaxPart();

  let promptBase = `
あなたはプロの物語作成AIです。次の条件に沿ったストーリーを日本語で生成してください。

【ジャンル】${genre}
【雰囲気・テンション】${ambience}
【構造形式】${structure}
【キーワード・トリガー語】${keywords}
【読者層】${audience}
【文字数の目安】${length}
【形式】${format}
`;

  let prompt = '';
  if (!previousStory) {
    prompt = promptBase + `第1部として物語を開始してください。`;
  } else {
    prompt = promptBase + `第${partNumber}部として、以下の物語の続きです。
前の内容を繰り返さず、これまでの流れに沿った新しい展開を描いてください。

前のストーリー：
${previousStory}
`;
    if (partNumber > maxPart) {
      prompt += `なお、指定された部数（${maxPart}部）は完了しています。さらに続く物語を自然に新章として進めてください。`;
    }
  }

  try {
    const storyPart = await generatePart(apiKey, prompt, 3000);

    const checkPrompt = `
次の物語の中で以下の矛盾を検出し、あれば指摘してください。
・構造矛盾（ジャンルとテンションの食い違い）
・トーン矛盾（キャラ設定やテーマと文体テンションの不一致）
・ロジック矛盾（死亡／別れ／壊れた要素の復活）
・キーワード間矛盾
・時系列矛盾

物語：
${storyPart}

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
      story: storyPart,
      check: parsedCheck,
      partNumber,
      message: partNumber > maxPart ? `指定部数（${maxPart}部）を超えましたが、自然な新章として続きが生成されました。` : undefined
    });

  } catch (error) {
    console.error("物語生成エラー:", error);
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
