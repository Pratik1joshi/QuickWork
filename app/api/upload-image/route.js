import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import cloudinary from "@/lib/cloudinary"

export async function POST(request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large. Maximum 5MB allowed." }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "quickwork/profiles",
          transformation: [
            { width: 200, height: 200, crop: "fill" }
          ],
          public_id: `user_${user.id}_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      ).end(buffer)
    })

    // Update user profile with new image URL
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        profile_image_url: result.secure_url,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      console.error("Database update error:", updateError)
      // Don't fail the request if DB update fails, but log it
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
      message: "Image uploaded successfully"
    })

  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 }
    )
  }
}
