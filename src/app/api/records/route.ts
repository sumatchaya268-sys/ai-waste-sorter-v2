import { NextResponse } from 'next/server';
import { addRecord, getAllRecords, updateRecordDisposal, WasteRecord, uploadImage, getAdminPasswordHash, hashPassword } from '@/lib/db';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const providedPassword = authHeader.replace('Bearer ', '');
  const providedHash = hashPassword(providedPassword);
  
  const savedHash = await getAdminPasswordHash();
  
  if (savedHash) {
    // Check against DB hash
    if (providedHash !== savedHash) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    // Fallback to ENV password if DB hash doesn't exist
    const envPassword = process.env.ADMIN_PASSWORD || 'admin1234';
    if (providedPassword !== envPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const records = await getAllRecords();
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check if it's a new record with an image to upload
    if (data.action === 'add') {
      const { record, imageBase64, allowImageUpload } = data;
      
      let imageUrl = null;
      if (allowImageUpload && imageBase64) {
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        imageUrl = await uploadImage(imageBase64, filename);
      }
      
      const newRecord: WasteRecord = {
        ...record,
        imageUrl,
        imageConsent: allowImageUpload
      };
      
      await addRecord(newRecord);
      return NextResponse.json({ success: true, record: newRecord });
    } 
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, isDisposed } = await request.json();
    await updateRecordDisposal(id, isDisposed);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
