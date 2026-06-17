const PROMPTS = {
  content: (text) => `你是一位专业的内容策略分析师。请分析以下内容，输出结构化报告：

内容：
${text}

请按以下格式输出（直接输出，不要加额外说明）：

【内容类型】
（判断是产品介绍/测评/教程/娱乐等）

【核心卖点】
（3条，每条一行，用- 开头）

【目标受众】
（年龄/性别/兴趣/消费力）

【Hook分析】
（开头3秒/第一句话是否抓人，为什么）

【优化建议】
（2-3条具体可执行的改进点）`,

  competitor: (text) => `你是一位竞品研究专家。请分析以下竞品内容，给出战略洞察：

内容：
${text}

请按以下格式输出：

【品牌定位】
（一句话核心定位）

【差异化优势】
（3条，用- 开头）

【弱点/可攻打点】
（2-3条）

【值得借鉴的策略】
（可以直接复用的打法）

【反向操作建议】
（我们如何做才能差异化）`,

  copywrite: (text) => `你是一位精通小红书/TikTok的爆款文案专家。请将以下内容改写为适合社交媒体的爆款文案：

原始内容：
${text}

请输出：

【小红书版】
（带emoji，口语化，有话题标签 #，200字以内）

【TikTok脚本版】
（开场白+核心内容+CTA，分3段，每段15字以内）

【朋友圈版】
（简洁有力，100字以内）`,

  keywords: (text) => `你是一位SEO和电商关键词专家。请从以下内容中提取关键词：

内容：
${text}

请输出：

【核心关键词】
（3-5个最重要的，每行一个）

【长尾关键词】
（5-8个具体搜索词，覆盖不同意图）

【竞争度评估】
（每个核心词的竞争难度：低/中/高）

【内容布局建议】
（如何在内容中自然融入这些词）`,
}

export async function analyzeWithAI({ text, type, provider, apiKey }) {
  const prompt = PROMPTS[type]?.(text) ?? PROMPTS.content(text)

  if (provider === 'deepseek') {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `DeepSeek 请求失败 ${res.status}`)
    }
    const data = await res.json()
    return data.choices[0].message.content.trim()
  }

  // Claude
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Claude 请求失败 ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text.trim()
}
