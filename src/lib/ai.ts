export async function getAISuggestions(prompt: string, context: any): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context })
  })
  if (!res.ok) throw new Error('AI request failed')
  const data = await res.json()
  return data.text as string
}

