import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FounderProfile {
  fullName: string;
  majors: string[];
  startupName: string;
  startupStage: string;
  industry: string;
  mainChallenge: string;
  supportNeeds: string[];
  meetingFrequency: string;
  threeMonthGoal: string;
}

interface MentorCandidate {
  id: string;
  fullName: string;
  currentRole: string;
  expertise: string[];
  industries: string[];
  experienceBackground: string[];
  preferredMenteeStages: string[];
  meetingFrequency: string;
  threeMonthOutcome: string;
  deterministicScore: number;
}

interface FounderCandidate {
  id: string;
  fullName: string;
  startupName: string;
  startupStage: string;
  industry: string;
  mainChallenge: string;
  supportNeeds: string[];
  meetingFrequency: string;
  threeMonthGoal: string;
  deterministicScore: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { mode } = body; // "founder" or "mentor"

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === "founder") {
      const { founder, candidates } = body as {
        mode: string;
        founder: FounderProfile;
        candidates: MentorCandidate[];
      };

      systemPrompt = `You are an expert mentor-founder matching engine for EPIC Lab ITAM. 
You receive a founder profile and a list of mentor candidates with their deterministic compatibility scores.
Your job is to deeply evaluate each candidate and return enriched scoring.

For each candidate, provide:
- score_challenge_expertise (0-35): How well the mentor's expertise and experience match the founder's specific challenge and support needs
- score_open_text_alignment (0-25): How well the mentor's 3-month outcome goal aligns with the founder's 3-month goal
- explanation: 2-3 sentences explaining why this mentor is a good fit. Be specific and reference both profiles.
- caveat: A brief note about any potential mismatch or consideration. Return null if none.

Return valid JSON only.`;

      userPrompt = JSON.stringify({
        founder: {
          name: founder.fullName,
          startup: founder.startupName,
          stage: founder.startupStage,
          industry: founder.industry,
          challenge: founder.mainChallenge,
          supportNeeds: founder.supportNeeds,
          threeMonthGoal: founder.threeMonthGoal,
        },
        candidates: candidates.map((c) => ({
          id: c.id,
          name: c.fullName,
          role: c.currentRole,
          expertise: c.expertise,
          industries: c.industries,
          background: c.experienceBackground,
          preferredStages: c.preferredMenteeStages,
          meetingFrequency: c.meetingFrequency,
          threeMonthOutcome: c.threeMonthOutcome,
          deterministicScore: c.deterministicScore,
        })),
      });
    } else if (mode === "mentor") {
      const { mentor, candidates } = body as {
        mode: string;
        mentor: {
          fullName: string;
          expertise: string[];
          industries: string[];
          experienceBackground: string[];
          preferredMenteeStages: string[];
          meetingFrequency: string;
          threeMonthOutcome: string;
        };
        candidates: FounderCandidate[];
      };

      systemPrompt = `You are an expert mentor-founder matching engine for EPIC Lab ITAM.
You receive a mentor profile and a list of founder candidates with their deterministic compatibility scores.
Your job is to deeply evaluate each candidate and return enriched scoring.

For each candidate, provide:
- score_challenge_expertise (0-35): How well the founder's challenge and needs align with what this mentor can offer
- score_open_text_alignment (0-25): How well the founder's 3-month goal aligns with what the mentor wants to help achieve
- explanation: 2-3 sentences explaining why this founder is a good match. Be specific.
- caveat: A brief note about any potential mismatch. Return null if none.

Return valid JSON only.`;

      userPrompt = JSON.stringify({
        mentor: {
          name: mentor.fullName,
          expertise: mentor.expertise,
          industries: mentor.industries,
          background: mentor.experienceBackground,
          preferredStages: mentor.preferredMenteeStages,
          meetingFrequency: mentor.meetingFrequency,
          threeMonthOutcome: mentor.threeMonthOutcome,
        },
        candidates: candidates.map((c) => ({
          id: c.id,
          name: c.fullName,
          startup: c.startupName,
          stage: c.startupStage,
          industry: c.industry,
          challenge: c.mainChallenge,
          supportNeeds: c.supportNeeds,
          threeMonthGoal: c.threeMonthGoal,
          deterministicScore: c.deterministicScore,
        })),
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_match_scores",
                description:
                  "Return enriched match scores for each candidate",
                parameters: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          score_challenge_expertise: {
                            type: "number",
                            minimum: 0,
                            maximum: 35,
                          },
                          score_open_text_alignment: {
                            type: "number",
                            minimum: 0,
                            maximum: 25,
                          },
                          explanation: { type: "string" },
                          caveat: { type: "string", nullable: true },
                        },
                        required: [
                          "id",
                          "score_challenge_expertise",
                          "score_open_text_alignment",
                          "explanation",
                          "caveat",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["results"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_match_scores" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI matching failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI returned unexpected format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
