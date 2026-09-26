import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

export const dynamic = 'force-dynamic';

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const { filename, subjectId } = await request.json();

    if (!filename || !subjectId) {
      return NextResponse.json({ error: "Missing filename or subjectId." }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'ChordsRecordings', subjectId, filename);
    const pythonScriptPath = path.join(process.cwd(), 'analyze_eeg.py');

    console.log(`Running analysis on: ${filePath}`);
    
    // Execute the Python script
    // Note: It assumes 'python' is available in the environment path
    const { stdout, stderr } = await execPromise(`python "${pythonScriptPath}" "${filePath}"`);
    
    console.log("Analysis output:", stdout);
    if (stderr) console.error("Analysis stderr:", stderr);

    return NextResponse.json({ success: true, message: "Analysis complete", stdout });
  } catch (error) {
    console.error("❌ ERROR during analysis:", error);
    return NextResponse.json({ error: "Analysis failed", details: String(error) }, { status: 500 });
  }
}
