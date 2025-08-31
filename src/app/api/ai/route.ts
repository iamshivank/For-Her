import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const client = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(req: NextRequest) {
  try {
    const { prompt, context } = await req.json()
    if (!client || !apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 501 })
    }

    const system = `You are CycleWise, a private reproductive health assistant. Provide empathetic, concise, evidence-informed insights. Safety: avoid diagnosis; suggest seeing a clinician when appropriate.`

    const genModel = client.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const input = `${system}\n\nUser: ${prompt}\n\nContext: ${JSON.stringify(context).slice(0, 6000)}`
    const result = await genModel.generateContent({ contents: [{ role: 'user', parts: [{ text: input }] }], generationConfig: { temperature: 0.4 } })
    const text = result.response.text() || 'No response.'
    return NextResponse.json({ text })
  } catch (error) {
    console.error('AI error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

