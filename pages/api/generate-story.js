export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { genre, ambience, structure, keywords, audience, length, format, previousStory, currentPart } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'OpenAI API キーが設定されていません。' });
  }

  let prompt = `
あなたはプロの物語作成AIです。
次の条件に沿ったストーリーを日本語で生成してください。

【ジャンル】${genre}
【雰囲気・テンション】${ambience}
【構造形式】${structure}
【キーワード・トリガー語】${keywords}
【読者層】${audience}
【文字数の目安】${length}
【形式】${format}

`;

  if (currentPart === 1) {
    prompt += `第1部として物語を開始してください。`;
  } else {
    prompt += `第${currentPart}部として、以下の物語の続きです。
前の物語を繰り返さず、次の章・次の展開を描いてください。

前の物語：
${previousStory}
`;
  }

  try {
    const content = await generatePart(apiKey, prompt, 3000);
    const checkPrompt = `
次の物語の中で以下の矛盾を検出し、あれば指摘してください。
・構造矛盾
・トーン矛盾
・ロジック矛盾
・キーワード間矛盾
・時系列矛盾

物語：
${content}

結果は以下形式で返してください。
{
  "構造矛盾": "...",
  "トーン矛盾": "...",
  "ロジック矛盾": "...",
  "キーワード間矛盾": "...",
  "時系列矛盾": "..."
}
`;

    const checkRaw = await generatePart(apiKey, checkPrompt, 1000, '物語の矛盾検出AI');
    let parsedCheck = {};
    try {
      parsedCheck = JSON.parse(checkRaw);
    } catch {
      parsedCheck = { raw: checkRaw };
    }

    return res.status(200).json({
      story: content,
      check: parsedCheck,
      partNumber: currentPart
    });

  } catch (err) {
    console.error('物語生成エラー:', err);
    return res.status(500).json({ message: '物語生成中にエラーが発生しました。' });
  }
}

async function generatePart(apiKey, prompt, maxTokens, systemRole = 'あなたはプロの物語作成AIです。') {
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
