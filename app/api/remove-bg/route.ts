import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PHOTOROOM_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PHOTOROOM_API_KEY not configured. Add it to .env.local' },
        { status: 500 }
      )
    }

    const formData = await req.formData()

    // Read our custom options — not forwarded to PhotoRoom
    const shadowMode = formData.get('_shadowMode') as string | null  // 'none'|'ai.soft'|'ai.hard'|'ai.floating'
    formData.delete('_shadowMode')

    const withShadow = shadowMode && shadowMode !== 'none'

    let url: string
    let photoRoomForm: FormData

    if (withShadow) {
      // Shadow requires the Image Editing API (v2/edit — Plus plan)
      // It needs background.color set (transparent not supported with shadow)
      // We use white so the shadow renders; the user's canvas bg is applied separately
      url = 'https://image-api.photoroom.com/v2/edit'
      photoRoomForm = new FormData()
      photoRoomForm.append('imageFile', formData.get('image_file') as Blob)
      photoRoomForm.append('shadow.mode', shadowMode)
      photoRoomForm.append('background.color', 'transparent')
      photoRoomForm.append('export.format', 'png')
    } else {
      // BG removal only — faster Basic plan endpoint
      url = 'https://sdk.photoroom.com/v1/segment'
      photoRoomForm = formData  // pass through as-is (has image_file)
    }

    const photoRoomRes = await fetch(url, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: photoRoomForm,
    })

    if (!photoRoomRes.ok) {
      const errText = await photoRoomRes.text()
      return NextResponse.json(
        { error: `PhotoRoom API error ${photoRoomRes.status}: ${errText}` },
        { status: photoRoomRes.status }
      )
    }

    const imageBuffer = await photoRoomRes.arrayBuffer()
    const contentType = photoRoomRes.headers.get('content-type') || 'image/png'

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('remove-bg route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
