
const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error("OPENROUTER_API_KEY is missing.");
  process.exit(1);
}

const response = await fetch(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3.5-lightning:free",
      messages: [
        {
          role: "user",
          content:
            'Compare these items: Lost: "black wireless earbuds"; Found: "black Bluetooth buds". Explain their similarities briefly.',
        },
      ],
    }),
  }
);

const data = await response.json();

if (!response.ok) {
  console.error("API error:", response.status, data);
  process.exit(1);
}

console.log(data.choices[0].message.content);
