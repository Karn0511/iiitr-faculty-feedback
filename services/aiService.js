const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================================
// Initialize Gemini client with environment API key
// Using gemini-1.5-flash: fast, cost-efficient for text analysis
// ============================================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ============================================================
// ANALYZE FEEDBACK — Sentiment & Structured Insight Engine
//
// @param {string[]} remarksArray - Raw anonymous student remarks
// @returns {Object} structured insights:
//   - strengths           {string[]} — 3 teaching strengths
//   - improvements        {string[]} — 2 areas to improve
//   - overallSentiment    {'Positive'|'Neutral'|'Negative'}
//   - sentimentScore      {number}   — 0.0 (negative) to 1.0 (positive)
//   - summary             {string}   — 1-sentence executive summary
//   - analyzedCount       {number}   — number of remarks processed
// ============================================================
const analyzeFeedback = async (remarksArray) => {
    // Guard: no data to analyze
    if (!remarksArray || remarksArray.length === 0) {
        return {
            strengths:        ['Insufficient feedback data for analysis.'],
            improvements:     ['Insufficient feedback data for analysis.'],
            overallSentiment: 'Neutral',
            sentimentScore:   0.5,
            summary:          'No remarks were provided for this analysis.',
            analyzedCount:    0
        };
    }

    // Format remarks as a numbered, quoted list for precise AI context
    const remarksList = remarksArray
        .map((r, i) => `${i + 1}. "${r}"`)
        .join('\n');

    // ============================================================
    // STRICT PROMPT — JSON-only output enforced
    // Instructs AI to stay grounded in provided data only.
    // ============================================================
    const prompt = `
You are an academic performance analyst for IIIT Ranchi, a premier technical university in India.
Analyze the following anonymous student feedback remarks for a faculty member.

Remarks:
${remarksList}

Return ONLY a valid JSON object — no markdown, no explanation, no code fences — in exactly this structure:
{
  "strengths": [
    "Actionable strength point 1 grounded in the feedback",
    "Actionable strength point 2 grounded in the feedback",
    "Actionable strength point 3 grounded in the feedback"
  ],
  "improvements": [
    "Constructive improvement point 1 grounded in the feedback",
    "Constructive improvement point 2 grounded in the feedback"
  ],
  "overallSentiment": "Positive",
  "sentimentScore": 0.82,
  "summary": "One concise executive-summary sentence about this faculty member's teaching effectiveness."
}

Rules (strictly enforce):
- Provide EXACTLY 3 strengths and EXACTLY 2 improvements.
- overallSentiment must be exactly one of: "Positive", "Neutral", or "Negative".
- sentimentScore must be a float between 0.0 (most negative) and 1.0 (most positive).
- Every point must be a complete, professional, actionable sentence.
- Do NOT invent data or make assumptions not supported by the remarks.
- Do NOT include any text, commentary, or formatting outside the JSON object.
    `.trim();

    const result  = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Defensively strip markdown code fences Gemini sometimes adds
    const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i,     '')
        .replace(/\s*```$/,      '');

    // Parse — will throw on malformed JSON (caught by calling controller)
    const parsed = JSON.parse(cleaned);

    return {
        strengths:        Array.isArray(parsed.strengths)    ? parsed.strengths    : [],
        improvements:     Array.isArray(parsed.improvements) ? parsed.improvements : [],
        overallSentiment: parsed.overallSentiment ?? 'Neutral',
        sentimentScore:   typeof parsed.sentimentScore === 'number'
                            ? Math.min(1, Math.max(0, parsed.sentimentScore))
                            : 0.5,
        summary:          parsed.summary ?? '',
        analyzedCount:    remarksArray.length
    };
};

module.exports = { analyzeFeedback };
