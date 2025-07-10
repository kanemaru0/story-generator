// pages/api/save-feedback.ts

import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { rating, comment } = req.body

  if (!rating || !comment) {
    return res.status(400).json({ message: '評価とコメントは必須です。' })
  }

  try {
    const { error } = await supabase.from('feedbacks').insert([{ rating, comment }])
    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).json({ message: 'レビューの保存に失敗しました。' })
    }
    return res.status(200).json({ message: 'レビューを保存しました。' })
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ message: 'サーバーエラーが発生しました。' })
  }
}
