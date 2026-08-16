import { generateText } from "ai";

const DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL || "openai/gpt-5.6-sol";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic } = request.body || {};
    const cleanTopic = String(topic || "").trim().slice(0, 160);

    if (!cleanTopic) {
      return response.status(400).json({ error: "A topic is required." });
    }

    try {
      const { text } = await generateText({
        model: DEFAULT_MODEL,
        system: [
          "You create biblically faithful, pastorally sensitive Christian youth lessons for teen ministry leaders.",
          "Never include private student information. Keep the tone warm, practical, and age-appropriate for today's Christian teens.",
          "Return only valid JSON. Do not wrap it in markdown.",
        ].join(" "),
        prompt: buildPrompt(cleanTopic),
      });

      const lesson = normalizeLesson(JSON.parse(extractJson(text)), cleanTopic);
      return response.status(200).json({ lesson, source: "ai", model: DEFAULT_MODEL });
    } catch (error) {
      console.warn("AI lesson generation unavailable:", cleanErrorMessage(error));
      return response.status(200).json({
        lesson: fallbackLesson(cleanTopic),
        source: "fallback",
        warning: "AI generation was unavailable, so a structured starter lesson was created instead.",
      });
    }
  } catch (error) {
    console.error("Lesson generation request failed:", error);
    return response.status(500).json({ error: "The lesson could not be generated." });
  }
}

function cleanErrorMessage(error) {
  return String(error?.message || error || "Unknown error")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function buildPrompt(topic) {
  return `
Create one complete youth group lesson for Teen Fusion.

Topic typed by the teacher: "${topic}"

Return JSON with exactly this shape:
{
  "title": "short lesson title",
  "tagline": "one memorable sentence",
  "bigIdea": "one clear theological big idea",
  "scripture": "2-4 Bible references separated by semicolons",
  "teacherNotes": ["paragraph", "paragraph", "paragraph"],
  "talkingPoints": ["point", "point", "point", "point"],
  "creativeHook": "opening activity or illustration",
  "discussionQuestions": ["question", "question", "question", "question", "question"],
  "responseMoment": "closing prayer or action step",
  "imagePrompt": "visual style prompt for slides",
  "slideTitles": ["title slide", "big idea", "scripture", "talking points", "discussion", "response"]
}

Requirements:
- Use orthodox Christian framing without sounding cheesy or condescending.
- Give the teacher practical language they can actually say out loud.
- Make the lesson useful for middle school and high school students.
- Scripture references should be real and relevant.
- Keep the image prompt appropriate for church presentation slides: dramatic, readable, no horror, no weapons, no student likenesses.
`;
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function normalizeLesson(raw, topic) {
  return {
    title: limit(raw.title, titleCase(topic), 72),
    tagline: limit(raw.tagline, "Faith that meets real life.", 130),
    bigIdea: limit(raw.bigIdea, `God's truth gives students a better way to understand ${topic}.`, 220),
    scripture: limit(raw.scripture, "Psalm 139:13-16; Romans 12:2", 160),
    teacherNotes: normalizeList(raw.teacherNotes, [
      `Start by naming why ${topic} matters in real teen life, then connect the room to Scripture before moving into advice.`,
      "Give students space to answer honestly without forcing vulnerability.",
      "Keep bringing the conversation back to who God is, what He says is true, and what one faithful next step could look like.",
    ], 5, 420),
    talkingPoints: normalizeList(raw.talkingPoints, [
      "God cares about the hidden parts of our lives, not just our church answers.",
      "The gospel gives students a stable identity before it gives them a to-do list.",
      "Wisdom is usually practiced in small choices before it is seen in big moments.",
      "Christian community helps students remember truth when pressure gets loud.",
    ], 6, 220),
    creativeHook: limit(raw.creativeHook, `Ask students to write one word they associate with ${topic}, then compare how those words reveal pressure, hope, fear, or desire.`, 420),
    discussionQuestions: normalizeList(raw.discussionQuestions, [
      `Where do you see ${topic} showing up in everyday teen life?`,
      "What makes this hard to talk about honestly?",
      "What does Scripture reveal about God's heart in this area?",
      "What lie does this topic tempt students to believe?",
      "What is one wise next step this week?",
    ], 7, 220),
    responseMoment: limit(raw.responseMoment, "Close by inviting students to silently name one pressure they want to surrender to God, then pray for courage to take one obedient next step this week.", 420),
    imagePrompt: limit(raw.imagePrompt, `Teen Fusion slide art about ${topic}, cinematic dark background, gold light, blue accent glow, hopeful Christian tone, clean space for readable text`, 360),
    slideTitles: normalizeList(raw.slideTitles, [
      titleCase(topic),
      "Big Idea",
      "Open the Scriptures",
      "Talking Points",
      "Questions for the Room",
      "Response Moment",
    ], 8, 80),
  };
}

function fallbackLesson(topic) {
  return normalizeLesson({}, topic);
}

function normalizeList(value, fallback, maxItems, maxLength) {
  const list = Array.isArray(value) ? value : [];
  const cleaned = list
    .map((item) => limit(item, "", maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
  return cleaned.length ? cleaned : fallback;
}

function limit(value, fallback, maxLength) {
  const text = String(value || fallback || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function titleCase(value) {
  return String(value || "Student Faith")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}
