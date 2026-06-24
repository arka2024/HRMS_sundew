import fs from 'fs';

async function testUpload() {
  const fileContent = "Sarah Chen's Evaluation. Tech: 4, Learn: 5, Adapt: 4, Attitude: 5. Sarah is doing great.";
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  let body = `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="sarah_eval.txt"\r\n`;
  body += `Content-Type: text/plain\r\n\r\n`;
  body += `${fileContent}\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="type"\r\n\r\n`;
  body += `Document\r\n`;
  body += `--${boundary}--\r\n`;

  try {
    const res = await fetch('http://localhost:5001/api/documents/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': 'Bearer hr_token_123'
      },
      body: body
    });
    
    console.log("Upload Status:", res.status);
    const text = await res.text();
    console.log("Upload Response:", text);
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

testUpload();
