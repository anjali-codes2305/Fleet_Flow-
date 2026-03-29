import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch fleet data
    const [{ data: vehicles }, { data: trips }, { data: maintenance }, { data: drivers }] = await Promise.all([
      sb.from("vehicles").select("*"),
      sb.from("trips").select("*").order("created_at", { ascending: false }).limit(50),
      sb.from("maintenance_logs").select("*").order("created_at", { ascending: false }).limit(20),
      sb.from("drivers").select("*"),
    ]);

    const stats = {
      totalVehicles: vehicles?.length || 0,
      onTrip: vehicles?.filter(v => v.status === "On Trip").length || 0,
      inShop: vehicles?.filter(v => v.status === "In Shop").length || 0,
      outOfService: vehicles?.filter(v => v.status === "Out of Service").length || 0,
      available: vehicles?.filter(v => v.status === "Available").length || 0,
      completedTrips: trips?.filter(t => t.status === "Completed").length || 0,
      activeTrips: trips?.filter(t => t.status === "Dispatched").length || 0,
      draftTrips: trips?.filter(t => t.status === "Draft").length || 0,
      scheduledMaintenance: maintenance?.filter(m => m.status === "Scheduled").length || 0,
      totalDrivers: drivers?.length || 0,
      activeDrivers: drivers?.filter(d => d.status === "On Duty" || d.status === "On Trip").length || 0,
      suspendedDrivers: drivers?.filter(d => d.status === "Suspended").length || 0,
      lowSafetyDrivers: drivers?.filter(d => d.safety_score < 80).length || 0,
      expiringLicenses: drivers?.filter(d => {
        const exp = new Date(d.license_expiry);
        const now = new Date();
        const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff < 30 && diff > 0;
      }).length || 0,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a fleet management AI analyst. Generate a concise, actionable fleet health summary. Return EXACTLY a JSON object with this structure (no markdown, no code blocks, just raw JSON):
{
  "health_score": <number 0-100>,
  "status": "<green|yellow|red>",
  "headline": "<one line summary, max 60 chars>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "alerts": ["<urgent alert if any>"],
  "recommendation": "<top priority action>"
}`
          },
          {
            role: "user",
            content: `Fleet stats: ${JSON.stringify(stats)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response
    let parsed;
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        health_score: 75,
        status: "yellow",
        headline: "Fleet operational with some attention needed",
        insights: ["AI analysis temporarily unavailable"],
        alerts: [],
        recommendation: "Review fleet status manually",
      };
    }

    return new Response(JSON.stringify({ ...parsed, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fleet-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
