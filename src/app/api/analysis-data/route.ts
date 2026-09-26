import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const filename = searchParams.get('filename');
  // User-chosen baseline filename (passed from the frontend picker)
  const chosenBaseline = searchParams.get('baselineFilename');

  if (!subjectId || !filename) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const baseName = filename.replace('.csv', '');
  const dir = path.join(process.cwd(), 'ChordsRecordings', subjectId);

  try {
    // Current file's bandpower
    const bandpower = await readFile(
      path.join(dir, `${baseName}_BandPower_PerMinute.csv`), 'utf-8'
    ).catch(() => null);

    // All original recording files for this subject only (SubjectID-YYYYMMDD-HHMMSS.csv)
    const allFiles: string[] = await readdir(dir).catch(() => []);
    const originalFilePattern = /^.+-\d{8}-\d{6}\.csv$/;
    const csvFiles = allFiles
      .filter((f: string) => originalFilePattern.test(f))
      .sort();

    // Determine which file is the baseline:
    // If user chose one → use it; otherwise fall back to first file
    const baselineFilename = chosenBaseline || (csvFiles.length > 0 ? csvFiles[0] : null);
    const isBaselineFile = (baselineFilename === filename);

    let baselineBandpower = null;
    if (baselineFilename && baselineFilename !== filename) {
      const baseBaseName = baselineFilename.replace('.csv', '');
      baselineBandpower = await readFile(
        path.join(dir, `${baseBaseName}_BandPower_PerMinute.csv`), 'utf-8'
      ).catch(() => null);
    }

    return NextResponse.json({
      bandpower,
      baselineBandpower,
      baselineFilename,
      isBaselineFile,
      allSubjectFiles: csvFiles,       // Only this subject's files
      totalFilesForSubject: csvFiles.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read analysis files" }, { status: 500 });
  }
}
