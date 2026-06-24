import fetch from 'node-fetch';

async function loginHR() {
  const res = await fetch('http://localhost:5000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hr@sundew.com', password: 'password123' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Login failed: ' + JSON.stringify(data));
  return data.token;
}

async function uploadDocument(token) {
  const fileContent = "Sarah Chen's Evaluation. Tech: 4, Learn: 5, Adapt: 4, Attitude: 5. Great job!";
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="sarah_eval.txt"\r\n`;
  body += `Content-Type: text/plain\r\n\r\n`;
  body += `${fileContent}\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="type"\r\n\r\n`;
  body += `Document\r\n`;
  body += `--${boundary}--\r\n`;

  const res = await fetch('http://localhost:5001/api/documents/upload', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Authorization': `Bearer ${token}`
    },
    body
  });
  const text = await res.text();
  console.log('Upload status:', res.status);
  console.log('Response:', text);
}

(async () => {
  try {
    const token = await loginHR();
    console.log('HR token obtained');
    await uploadDocument(token);
  } catch (e) {
    console.error('Error:', e);
  }
})();
