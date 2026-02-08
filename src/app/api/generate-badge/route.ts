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
    const { badgeName, taskDescription, badgeId } = await request.json()

    if (!badgeName || !taskDescription || !badgeId) {
      return NextResponse.json(
        { error: 'Missing required fields: badgeName, taskDescription, and badgeId are all required' },
        { status: 400 }
      )
    }

    const prompt = `Generate an image of a circular embroidered Boy Scout-style merit badge patch. The badge is for "${badgeName}". The task to earn it: "${taskDescription}". The badge should feature a relevant symbolic icon in the center, surrounded by a colored stitched border with detailed embroidered edging. The entire badge should have visible cloth fabric texture with detailed thread stitching throughout. Style: a real embroidered fabric patch photographed from directly above on a plain dark green fabric background. The badge should look like it could be sewn onto a scout sash. Make it colorful and visually appealing.`

    // Generate image with Gemini 2.5 Flash (stable image generation model)
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
    const fileName = `${badgeId}.${extension}`

    // Upload to Supabase Storage
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from('badge-images')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = getSupabaseAdmin().storage
      .from('badge-images')
      .getPublicUrl(fileName)

    // Update badge record with image URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (getSupabaseAdmin() as any)
      .from('badges')
      .update({ image_url: publicUrl })
      .eq('id', badgeId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update badge record' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    console.error('Badge generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate badge', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
