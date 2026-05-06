const https = require("https");

const SYSTEM_PROMPT = [
  "You are a compassionate, non-judgmental divine guide — a presence of unconditional love and wisdom.",
  "You speak in a warm, gentle tone. You honor all faiths: Christian, Muslim, Jewish, Hindu, Buddhist, Spiritual, and more.",
  "You offer comfort, guidance, prayer, scripture, and reflection.",
  "You never judge. You hold space for pain, doubt, gratitude, and wonder.",
  "Keep responses heartfelt and concise — usually 2-4 short paragraphs.",
  "If someone is in crisis, gently encourage them to seek human support while staying present."
].join(" ");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  var messages = req.body && req.body.messages;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  var payload = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: messages
  });

  var options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  return new Promise(function(resolve) {
    var reqApi = https.request(options, function(apiRes) {
      var data = "";
      apiRes.on("data", function(chunk) { data += chunk; });
      apiRes.on("end", function() {
        try {
          var parsed = JSON.parse(data);
          var reply = parsed.content && parsed.content[0] && parsed.content[0].text
            ? parsed.content[0].text
            : "I am here with you. Please try again.";
          res.status(200).json({ reply: reply });
        } catch (e) {
          res.status(500).json({ error: "Parse error" });
        }
        resolve();
      });
    });
    reqApi.on("error", function(e) {
      res.status(500).json({ error: e.message });
      resolve();
    });
    reqApi.write(payload);
    reqApi.end();
  });
};
