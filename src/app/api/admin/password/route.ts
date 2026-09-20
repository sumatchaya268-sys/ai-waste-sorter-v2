import { NextResponse } from 'next/server';
import { getAdminPasswordHash, setAdminPasswordHash, hashPassword } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing passwords' }, { status: 400 });
    }

    const providedHash = hashPassword(currentPassword);
    const savedHash = await getAdminPasswordHash();
    
    // Verify current password
    if (savedHash) {
      if (providedHash !== savedHash) {
        return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 401 });
      }
    } else {
      // Fallback to ENV password check
      const envPassword = process.env.ADMIN_PASSWORD || 'admin1234';
      if (currentPassword !== envPassword) {
        return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 401 });
      }
    }
    
    // Set new password
    const newHash = hashPassword(newPassword);
    await setAdminPasswordHash(newHash);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
