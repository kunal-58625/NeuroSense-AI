import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const subjectId = formData.get('subjectId') as string || 'Unknown';

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create directory path at the root of the project
    const uploadDir = path.join(process.cwd(), 'ChordsRecordings', subjectId);
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });
    
    // Create file path using the original filename
    const filePath = path.join(uploadDir, file.name);
    
    // Write the file
    await writeFile(filePath, buffer);
    
    console.log("✅ Saved automatically to disk:", filePath);
    
    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("❌ ERROR during automatic file save:", error);
    return NextResponse.json({ error: "File save failed" }, { status: 500 });
  }
}
