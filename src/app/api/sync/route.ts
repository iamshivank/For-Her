import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { userId, ops } = await req.json()
    if (!userId || !Array.isArray(ops)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })

    // ops: [{ id, table, encrypted, action: 'upsert' | 'delete' }]
    const upserts = ops.filter((o: any) => o.action !== 'delete')
    const deletes = ops.filter((o: any) => o.action === 'delete')

    // Run in a transaction
    await prisma.$transaction(async (tx) => {
      if (upserts.length > 0) {
        for (const rec of upserts) {
          await tx.encryptedRecord.upsert({
            where: { id: rec.id },
            update: {
              userId,
              table: rec.table,
              encrypted: rec.encrypted,
            },
            create: {
              id: rec.id,
              userId,
              table: rec.table,
              encrypted: rec.encrypted,
            }
          })
        }
      }

      if (deletes.length > 0) {
        await tx.encryptedRecord.deleteMany({
          where: { id: { in: deletes.map((d: any) => d.id) }, userId }
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Sync POST error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const records = await prisma.encryptedRecord.findMany({
      where: { userId },
      orderBy: { updatedAt: 'asc' }
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Sync GET error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

