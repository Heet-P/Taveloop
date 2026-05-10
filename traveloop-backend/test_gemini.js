require('dotenv').config();

async function testGemini() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const prompt = `You are a travel expert API. Give me the top 3 most popular tourist attractions in Peru. Return strict JSON array of objects with keys: name (string), category (string), cost (number), durationMinutes (number), description (string).`;

  try {
    const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    console.log("Status:", gRes.status);
    const data = await gRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("Parsed length:", JSON.parse(text).length);
    console.log("First item:", JSON.parse(text)[0]);
  } catch (e) {
    console.error("Failed:", e);
  }
}

testGemini();
