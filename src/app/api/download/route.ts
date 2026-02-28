import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'upload', 'breeds.csv');
    const csvText = await fs.readFile(csvPath, 'utf-8');
    
    return new NextResponse(csvText, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="breeds.csv"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
