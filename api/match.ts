export const maxDuration = 20;

// --- 1. FOUNDER-SIDE PROMPT & INTERFACES ---
const FOUNDER_SYSTEM_PROMPT = `You are the explanation and partial scoring engine for EPIC Match Copilot, an AI tool for EPIC Lab ITAM.

Important context:
The application has already filtered and pre-scored the mentors. You must process and return an entry for EVERY mentor provided in the list. Do not drop, exclude, or filter out any mentors.

The following dimensions have already been computed and will be provided to you for each mentor:
- industry_fit (0 to 20)
- meeting_cadence_fit (0 to 10)
- experience_background_bonus (0 to 10)
- feedback_bonus (0 to 5)

Your task:
1. Score every mentor on your two dimensions.
2. Compute each mentor's final total score.
3. Rank mentors from highest to lowest final total.
4. Write a short explanation for each match in plain English.
5. Include one honest caveat only if there is a meaningful mismatch.
6. Return JSON only.

Important behavior rules:
- Do not invent missing data.
- Process ALL mentors provided; do not drop any from the matches array.
- Your explanation must be consistent with all scores including the precomputed ones.
- Mention only the strongest real reasons for the match.
- expertise_tags must be selected only from mentor.areas_of_expertise.
- score_total must equal: score_challenge_expertise + score_open_text_alignment + industry_fit + meeting_cadence_fit + experience_background_bonus + feedback_bonus

SCORING: CHALLENGE x EXPERTISE = 35 points
Measure how directly the mentor can help with:
- the founder's main_challenge
- the founder's support_needs
using:
- mentor areas_of_expertise
- mentor experience_background

Internal scoring split:
A. challenge_to_expertise_fit = up to 20
B. support_needs_fit = up to 10
C. challenge_to_background_relevance = up to 5

Challenge mapping:
- Product -> Product, Design, Founder
- Validation -> Product, Go-to-market, Growth, Founder, Consultant
- Technical build -> Engineering, Product, Founder, Operator
- Go-to-market -> Go-to-market, Growth, B2B Sales, Operator, Founder, Consultant
- Growth -> Growth, Go-to-market, B2B Sales, Product, Operator, Founder
- Fundraising -> Fundraising, Founder, Investor
- Operations -> Operations, Operator, Corporate, Founder
- Hiring -> Hiring, Operator, Corporate, Founder

Support needs mapping:
- Product feedback -> Product, Design, Founder
- Technical guidance -> Engineering, Founder, Operator
- Go-to-market coaching -> Go-to-market, Growth, B2B Sales, Operator, Consultant, Founder
- Growth strategy -> Growth, Go-to-market, Product, B2B Sales, Operator
- Fundraising advice -> Fundraising, Investor, Founder
- Introductions -> Investor, Founder, Operator, Corporate
- Accountability -> Founder, Operator, Consultant

Scoring guidance:
- 35 = very strong direct fit
- 26 to 34 = strong fit
- 16 to 25 = partial fit
- 1 to 15 = weak fit
- 0 = no meaningful fit

SCORING: OPEN TEXT ALIGNMENT = 25 points
Compare:
- founder_3_month_goal
- mentor_3_month_outcome

Reward specific overlap in milestone and support type.
Do not reward generic ambition or generic mentor language.

Scoring guidance:
- 25 = very strong alignment
- 20 = strong alignment
- 15 = moderate alignment
- 8 = weak alignment
- 0 = no meaningful alignment

RANKING RULES
1. Compute final_total = score_challenge_expertise + score_open_text_alignment + industry_fit + meeting_cadence_fit + experience_background_bonus + feedback_bonus
2. Sort by final_total descending
3. Break ties: higher score_challenge_expertise, then higher score_open_text_alignment, then more open_slots

OUTPUT RULES
Return ONLY valid JSON. No markdown formatting. No commentary outside the JSON.

The root of your JSON response must be an object with two keys: "matches" and "summary".

1. "matches": An array of ALL mentors provided. For each mentor include:
   - mentor_id (string)
   - mentor_name (string)
   - current_role (string)
   - expertise_tags (2 to 4 items, only from mentor.areas_of_expertise)
   - score_challenge_expertise (integer, 0 to 35)
   - score_open_text_alignment (integer, 0 to 25)
   - score_total (integer, 0 to 100)
   - explanation (2 to 3 sentences, plain English, for the founder)
   - caveat (one sentence or null)

2. "summary": An object containing:
   - "valid_mentors_considered": total count of mentors sent to you
   - "excluded_mentors_count": 0
   - "returned_matches_count": number of mentors in the matches array`;

// --- 2. MENTOR-SIDE PROMPT ---
const MENTOR_SYSTEM_PROMPT = `You are the explanation engine for EPIC Match Copilot. 
Your job is to review a specific Mentor's profile and a list of Founders they have been deterministically matched with. 

You must write a 2-3 sentence explanation directed AT THE MENTOR explaining exactly why they are uniquely positioned to help each founder. 
- Highlight overlap in industry, the founder's main challenges, and the mentor's expertise.
- Make it sound professional, encouraging, and highly specific to their shared data.
- Include a 1-sentence "caveat" if there is a slight mismatch (e.g., stage preference, bandwidth) to set expectations, or null if it's a perfect match.

OUTPUT RULES:
Return ONLY a JSON array of objects. No markdown formatting, no code blocks, no intro text.
Format:
[
  {
    "id": "founder_id_string",
    "explanation": "Your explanation here...",
    "caveat": "Your caveat here or null"
  }
]`;

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicResponse {
  content?: Array<AnthropicTextBlock | { type: string }>;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function extractTextContent(data: AnthropicResponse): string {
  if (!Array.isArray(data.content)) return '';
  return data.content
    .filter((block): block is AnthropicTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

// --- 3. MAIN API HANDLER ---
export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

  if (!apiKey) {
    return jsonResponse(500, { error: 'ANTHROPIC_API_KEY is not configured.' });
  }

  // Define the exact shape of the incoming request to satisfy TypeScript
  interface MatchRequestBody {
    role?: string;
    profile?: Record<string, unknown>;
    matches?: Record<string, unknown>[];
    founder?: Record<string, unknown>;
    mentors?: Record<string, unknown>[];
  }

  let body: MatchRequestBody;
  try {
    body = (await request.json()) as MatchRequestBody;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }

  // Determine if this is a Founder requesting Mentors, or a Mentor requesting Founders
  const isMentorRequest = body.role === 'mentor';

  // Validation
  if (isMentorRequest) {
    if (!body.profile || !Array.isArray(body.matches)) {
      return jsonResponse(400, { error: 'Mentor request must include profile and matches array.' });
    }
  } else {
    if (!body.founder || !Array.isArray(body.mentors)) {
      return jsonResponse(400, { error: 'Founder request must include founder and mentors array.' });
    }
  }

  // Setup Anthropic Call
  const systemPrompt = isMentorRequest ? MENTOR_SYSTEM_PROMPT : FOUNDER_SYSTEM_PROMPT;
  let userMessage = '';

  if (isMentorRequest) {
    userMessage = JSON.stringify({ mentor: body.profile, founders: body.matches });
  } else {
    // Map mentors to include the explicit 'open_slots' key Claude is looking for
    // Map mentors to include the explicit 'open_slots' key Claude is looking for
    // We use Record<string, unknown> instead of any, and safely cast the numbers
    const mentorsWithSlots = (body.mentors || []).map((m: Record<string, unknown>) => {
      const capStr = String(m.mentoring_capacity || m.mentoringCapacity || '0');
      const limitMatch = capStr.match(/\d+/);
      const capacityLimit = limitMatch ? parseInt(limitMatch[0], 10) : 0;
      const currentMatches = Number(m.current_matches || m.currentMatches || 0);
      
      return {
        ...m,
        open_slots: Math.max(0, capacityLimit - currentMatches)
      };
    });

    userMessage = `Here is the founder profile and mentor list:\n${JSON.stringify({ 
      founder: body.founder, 
      mentors: mentorsWithSlots 
    }, null, 2)}
    
Return your response exactly according to the OUTPUT RULES format.`;
  }

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!anthropicResponse.ok) {
      return jsonResponse(502, {
        error: 'Anthropic request failed.',
        status: anthropicResponse.status,
        details: await anthropicResponse.text(),
      });
    }

    const data = (await anthropicResponse.json()) as AnthropicResponse;
    const rawText = extractTextContent(data);
    
    // Safer JSON extraction: grabs the first { object } or [ array ] it sees
    const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const clean = jsonMatch ? jsonMatch[0] : rawText.trim();

    if (!clean) {
      return jsonResponse(502, { error: 'Anthropic returned no text content.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('[server] JSON Parse Error. Raw text:', clean);
      return jsonResponse(502, { error: 'Anthropic returned invalid JSON.', raw: clean });
    }

    // Basic shape validation before returning
    if (isMentorRequest && !Array.isArray(parsed)) {
      console.error('[server] Shape invalid: Expected array for mentor request');
      return jsonResponse(502, { error: 'Anthropic response shape was invalid for mentor.', raw: parsed });
    } else if (!isMentorRequest && (!Array.isArray(parsed.matches) || !parsed.summary)) {
      console.error('[server] Shape invalid: Missing matches array or summary object');
      return jsonResponse(502, { error: 'Anthropic response shape was invalid for founder.', raw: parsed });
    }

    return jsonResponse(200, parsed);
  } catch (error) {
    console.error('EPIC Match /api/match error:', error);
    return jsonResponse(500, { error: 'Unexpected server error while matching.' });
  }
}