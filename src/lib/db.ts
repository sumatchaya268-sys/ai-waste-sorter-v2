import { Redis } from '@upstash/redis';
import { put } from '@vercel/blob';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

export type WasteRecord = {
  id: string;
  userId: string;
  itemName: string;
  category: string;
  confidence: number;
  disposalSteps: string;
  isHardToDispose: boolean;
  warningMessage?: string | null;
  mode: string;
  isDisposed: boolean;
  date: string;
  imageUrl?: string | null;
  imageConsent?: boolean;
};

// Upload an image to Vercel Blob
export async function uploadImage(base64Data: string, filename: string): Promise<string> {
  try {
    // Remove data URL prefix
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, 'base64');
    
    // Upload to Blob
    const { url } = await put(`waste-images/${filename}`, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });
    
    return url;
  } catch (error) {
    console.error('Error uploading image:', error);
    return '';
  }
}

// Add a new record
export async function addRecord(record: WasteRecord) {
  try {
    const history = (await kv.get<WasteRecord[]>('waste_history')) || [];
    history.unshift(record); // Add to beginning
    await kv.set('waste_history', history);
  } catch (error) {
    console.error('Error adding record to KV:', error);
  }
}

// Get all records
export async function getAllRecords(): Promise<WasteRecord[]> {
  try {
    const history = (await kv.get<WasteRecord[]>('waste_history')) || [];
    return history;
  } catch (error) {
    console.error('Error fetching records from KV:', error);
    return [];
  }
}

// Update disposal status of a record
export async function updateRecordDisposal(id: string, isDisposed: boolean) {
  try {
    const history = (await kv.get<WasteRecord[]>('waste_history')) || [];
    const index = history.findIndex(r => r.id === id);
    
    if (index !== -1) {
      history[index].isDisposed = isDisposed;
      await kv.set('waste_history', history);
    }
  } catch (error) {
    console.error('Error updating record in KV:', error);
  }
}

// ----------------------
// Password Management
// ----------------------
import crypto from 'crypto';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getAdminPasswordHash(): Promise<string | null> {
  try {
    return await kv.get<string>('admin_password_hash');
  } catch (error) {
    console.error('Error fetching password from KV:', error);
    return null;
  }
}

export async function setAdminPasswordHash(hash: string) {
  try {
    await kv.set('admin_password_hash', hash);
  } catch (error) {
    console.error('Error setting password in KV:', error);
  }
}
