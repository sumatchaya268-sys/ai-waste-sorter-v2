import { GoogleGenerativeAI } from '@google/generative-ai';

export async function analyzeWaste(imageBase64: string, mode: 'general' | 'school') {
  // Support multiple API keys separated by commas to bypass free tier rate limits
  const apiKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  
  // Remove the data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const modeInstructions = mode === 'general' 
    ? 'โหมดทั่วไป: หมวดหมู่คือ ขยะอันตราย, รีไซเคิล, ขยะอินทรีย์, ขยะทั่วไป'
    : 'โหมดโรงเรียน: หมวดหมู่คือ ขวดน้ำ, ขยะทั่วไป, ขยะอินทรีย์, เศษอาหาร';

  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านการแยกขยะวิเคราะห์ภาพขยะนี้ตาม ${modeInstructions}
    
    **กฎสำคัญ (บังคับ):** 
    1. ภาพสิ่งของเครื่องใช้ทุกชนิด (เช่น เสื้อผ้าเก่า ของเล่น หนังสือ เครื่องใช้ไฟฟ้า เฟอร์นิเจอร์ ฯลฯ) ที่ผู้ใช้อาจต้องการโละทิ้ง ให้ถือว่าเป็น "สิ่งของที่ต้องการจัดการ" ห้ามตอบว่าไม่ใช่ขยะเด็ดขาด ให้จัดเข้าหมวด "ขยะทั่วไป" หรือ "รีไซเคิล" (ตามความเหมาะสม)
    2. จะตอบว่า "ไม่ใช่ขยะ" ได้ก็ต่อเมื่อ ภาพนั้นเป็น สิ่งมีชีวิต (คน, สัตว์), ทิวทัศน์เปล่าๆ ไม่มีสิ่งของ, หรือภาพเบลอมืดจนมองไม่รู้เรื่องเท่านั้น
    3. ขยะที่ย่อยสลายได้ตามธรรมชาติทั้งหมด เช่น ใบไม้แห้ง กิ่งไม้แห้ง เศษผักผลไม้ เศษอาหาร ให้จัดเป็นหมวด "ขยะอินทรีย์" (ห้ามตอบว่า ขยะเปียก เด็ดขาด โดยเฉพาะกับใบไม้แห้งหรือกิ่งไม้แห้ง) ให้พิจารณาจากวัสดุจริงไม่ใช่แค่ชื่อเรียก
    4. หากภาพเบลอมาก มืดเกินไป มองไม่รู้เรื่อง ห้ามเดามั่ว ให้จัดประเภท category เป็น "ไม่ใช่ขยะ"
    5. คุณต้องตอบกลับมาเป็น JSON เท่านั้น ห้ามพิมพ์ข้อความอื่นนอกกรอบ JSON เด็ดขาด
    
    โปรดส่งคืนผลลัพธ์เป็น JSON format เท่านั้น โดยใช้โครงสร้างนี้:
    {
      "itemName": "ชื่อสิ่งที่อยู่ในภาพ (string)",
      "category": "ประเภทขยะตามโหมดที่เลือก (หากไม่ใช่ขยะให้ตอบว่า 'ไม่ใช่ขยะ') (string)",
      "confidence": "เปอร์เซ็นต์ความมั่นใจ 0-100 (number)",
      "disposalSteps": "วิธีจัดการที่ถูกต้องเป็นข้อๆ (หากไม่ใช่ขยะให้ตอบว่า 'สิ่งนี้ไม่ใช่ขยะ จึงไม่ต้องนำไปทิ้ง') (string)",
      "isHardToDispose": "เป็นขยะอันตรายหรือจัดการยากหรือไม่ (boolean)",
      "warningMessage": "ข้อความแจ้งเตือนถ้ามี (หากไม่ใช่ขยะให้เตือนผู้ใช้ว่า 'ระบบตรวจพบว่านี่ไม่ใช่ขยะ โปรดถ่ายภาพใหม่อีกครั้ง') (string หรือ null)"
    }
    ไม่ต้องใส่ markdown formatting หรือ \`\`\`json กลับมา ให้ส่งคืนเป็น text ที่เป็น JSON ที่ถูกต้องเลย
  `;

  let lastError: any = null;
  // If no keys provided, it will try with empty string and fail normally
  const numAttempts = Math.max(1, Math.min(apiKeys.length, 4));
  
  // Shuffle keys so we don't always start with the same one
  const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);

  for (let i = 0; i < numAttempts; i++) {
    try {
      const currentKey = shuffledKeys[i] || '';
      const genAI = new GoogleGenerativeAI(currentKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Extract JSON block using regex to avoid parsing errors from extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI did not return valid JSON. Raw output: ' + text);
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      lastError = error;
      
      // If we still have attempts left, wait 1 second before trying next key to be safe
      if (i < numAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  throw new Error(lastError?.message || 'Failed to analyze waste after multiple attempts');
}
