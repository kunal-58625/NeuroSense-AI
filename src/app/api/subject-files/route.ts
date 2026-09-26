import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');

  if (!subjectId) {
    return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), 'ChordsRecordings', subjectId);

  try {
    const allFiles: string[] = await readdir(dir).catch(() => []);

    // Only show original recording files: SubjectID-YYYYMMDD-HHMMSS.csv
    // Exclude derived files: CleanedSignal, FrequencySpectrum, BandPower, etc.
    const originalFilePattern = /^.+-\d{8}-\d{6}\.csv$/;
    const csvFiles = allFiles
      .filter((f: string) => originalFilePattern.test(f))
      .sort();

    return NextResponse.json({ files: csvFiles });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read subject folder" }, { status: 500 });
  }
}
