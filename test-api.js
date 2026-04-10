require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testApi() {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: "Bonjour ! Présente-toi en une phrase.",
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === "text") {
      console.log("Réponse de Claude :", block.text);
    }
  }

  console.log("\nUsage :", response.usage);
}

testApi().catch(console.error);
