import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeWaste(imageBase64: string, mode: 'general' | 'school') {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' }); // Updated to working 2026 model

  // Remove the data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const modeInstructions = mode === 'general' 
    ? 'โหมดทั่วไป: หมวดหมู่คือ ขยะอันตราย, รีไซเคิล, ขยะเปียก, ขยะทั่วไป'
    : 'โหมดโรงเรียน: หมวดหมู่คือ ขวดน้ำ, ขยะทั่วไป, ใบไม้, เศษอาหาร';

  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านการแยกขยะวิเคราะห์ภาพขยะนี้ตาม ${modeInstructions}
    
    **กฎสำคัญ:** หากรูปภาพนี้ "ไม่ใช่ขยะ" อย่างชัดเจน (เช่น เป็นรูปคน, สัตว์ป่า, ทิวทัศน์, โทรศัพท์ที่กำลังใช้งาน ฯลฯ) 
    ให้จัดประเภทเป็น "ไม่ใช่ขยะ" ทันที โดยห้ามพยายามยัดเยียดให้เป็นขยะเด็ดขาด
    
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

  try {
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
    
    // Clean up potential markdown formatting in the response
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error analyzing waste:', error);
    throw new Error('Failed to analyze waste');
  }
}
