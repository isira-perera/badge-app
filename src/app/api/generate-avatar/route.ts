import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

// Lazy-initialized clients — avoids build-time errors when env vars aren't available
let genAI: GoogleGenAI | null = null
let supabaseAdmin: ReturnType<typeof createClient> | null = null

function getGenAI() {
  if (!genAI) genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  return genAI
}

function getSupabaseAdmin() {
  if (!supabaseAdmin) supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return supabaseAdmin
}

export async function POST(request: NextRequest) {
  try {
    const { userId, color, symbol, vibe } = await request.json()

    if (!userId || !color || !symbol || !vibe) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, color, symbol, and vibe are all required' },
        { status: 400 }
      )
    }

    const prompt = `Generate a circular embroidered patch-style profile avatar. Color theme: ${color}. Central symbol: ${symbol}. Mood/style: ${vibe}. No text, no letters, no words. Embroidered fabric texture, stitched border, photographed from above on dark green fabric. Colorful and visually appealing.`

    // Generate image with Gemini 2.5 Flash
    const response = await getGenAI().models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Text', 'Image'],
      },
    })

    // Extract image data from response
    const parts = response.candidates?.[0]?.content?.parts
    if (!parts) {
      return NextResponse.json({ error: 'No response generated from Gemini' }, { status: 500 })
    }

    let imageData: string | null = null
    let mimeType: string = 'image/png'

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data ?? null
        mimeType = part.inlineData.mimeType || 'image/png'
        break
      }
    }

    if (!imageData) {
      return NextResponse.json({ error: 'No image data in Gemini response' }, { status: 500 })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64')
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png'
    const fileName = `${userId}.${extension}`

    // Upload to Supabase Storage (avatars bucket)
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload avatar to storage' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = getSupabaseAdmin().storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile record with avatar URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (getSupabaseAdmin() as any)
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ avatarUrl: publicUrl })
  } catch (error) {
    console.error('Avatar generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate avatar', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
