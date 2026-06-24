import fs from 'fs';
import pdfParse from 'pdf-parse';
import { createRequire } from 'module';

async function test() {
  const associates = [
    { id: 'sarah-chen', name: 'Sarah Chen' }
  ];
  const associateNames = associates.map(a => `${a.id} (${a.name})`).join(', ');

  const extractedText = `Sarah Chen's Evaluation. Tech: 4, Learn: 5, Adapt: 4, Attitude: 5. Great job!`;

  const groqKey = process.env.GROQ_API_KEY || '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';
  const prompt = `You are an HR Evaluation parser.
Given the following performance review document text, extract the evaluation scores.
Match the associate to one of these valid IDs: ${associateNames}.
Return ONLY a valid JSON object matching this structure (no markdown, no extra text):
{
  "id": "matched-associate-id",
  "tech": 4, 
  "learn": 4, 
  "adapt": 4, 
  "attitude": 4, 
  "comments": "Short summary"
}
Document Text:
${extractedText}`;

  console.log("Calling Groq...");
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });

  if (groqRes.ok) {
    const groqData = await groqRes.json();
    console.log("Response:", groqData.choices[0].message.content);
    const content = groqData.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("Parsed JSON:", parsed);
    } else {
      console.log("No JSON matched!");
    }
  } else {
    console.error("Groq API error", await groqRes.text());
  }
}

test();
