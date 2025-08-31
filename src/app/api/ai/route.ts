import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY
const client = apiKey ? new OpenAI({ apiKey }) : null

export async function POST(req: NextRequest) {
  try {
    const { prompt, context } = await req.json()
    if (!client || !apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 501 })
    }

    const system = `You are CycleWise, a private reproductive health assistant. Provide empathetic, concise, evidence-informed insights.
Safety: avoid diagnosis; suggest seeing a clinician when appropriate.`

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: `${prompt}\n\nContext: ${JSON.stringify(context).slice(0, 6000)}` }
    ] as any

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages
    })

    const text = completion.choices?.[0]?.message?.content ?? 'No response.'
    return NextResponse.json({ text })
  } catch (error) {
    console.error('AI error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

