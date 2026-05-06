const https = require("https");

// SHORT system prompt = fewer input tokens = lower cost
const SYSTEM_PROMPT = "You are a compassionate divine guide, honoring all faiths. Speak warmly and briefly. Offer comfort, scripture, and prayer. Never judge. 2-3 short paragraphs max. If someone is in crisis, gently suggest human support.";

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

  // Only send last 6 messages to keep input tokens low
  var trimmed = messages.slice(-6);

  var payload = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: trimmed
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
