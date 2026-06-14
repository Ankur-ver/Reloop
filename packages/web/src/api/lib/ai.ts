import { createGateway, generateText } from "ai";
import { fetchUrlAsBase64 } from "./image-utils";

const gateway = createGateway({
  baseURL: process.env.AI_GATEWAY_BASE_URL!,
  apiKey: process.env.AI_GATEWAY_API_KEY!,
});

const MODEL = "google/gemini-3-flash";

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const { text } = await generateText({
    model: gateway(MODEL),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
  });
  return text;
}

function extractJSON(raw: string): any {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Find first { ... } block
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

// ─── P2P Photo Quality Analysis ───────────────────────────────────────────

// ─── Recycle Material Analysis ────────────────────────────────────────────

const RECYCLE_SYSTEM = `You are ReLoop's recycling AI expert. Given a product category and description, analyze its recyclability and material composition.

Return a JSON object with EXACTLY these fields:
{
  "isRecyclable": true | false,
  "recycleScore": <integer 0-100, how recyclable the product is>,
  "materials": [
    { "name": "<material name>", "percentage": <integer 0-100>, "recyclable": true | false, "color": "<hex color for UI>" }
  ],
  "parts": [
    { "name": "<part name>", "material": "<primary material>", "recyclable": true | false, "disposalMethod": "<how to dispose>" }
  ],
  "environmentalImpact": {
    "co2SavedKg": <number, CO2 saved by recycling vs landfill>,
    "waterSavedL": <number, water saved>,
    "energySavedKwh": <number, energy saved>
  },
  "instructions": ["<step 1>", "<step 2>", "<step 3>"],
  "certifiedCentres": ["<type of recycling center that accepts this>"],
  "recyclingReason": "<2 sentence explanation of why/why not recyclable and what happens to it>"
}

Rules:
- materials percentages must add up to 100
- Use realistic material compositions for the product category
- colors: plastic=#3B82F6, metal=#F59E0B, glass=#22C55E, rubber=#8B5CF6, fabric=#EC4899, paper=#F97316, circuit=#EF4444, lithium=#06B6D4
- isRecyclable = true if at least 50% of materials are recyclable
- Be specific and educational about disposal methods
- Respond with ONLY the JSON object, no markdown`;

export async function aiAnalyzeRecyclability(input: {
  category: string;
  title: string;
  condition: string;
  qualityGrade: string;
}): Promise<{
  isRecyclable: boolean;
  recycleScore: number;
  materials: { name: string; percentage: number; recyclable: boolean; color: string }[];
  parts: { name: string; material: string; recyclable: boolean; disposalMethod: string }[];
  environmentalImpact: { co2SavedKg: number; waterSavedL: number; energySavedKwh: number };
  instructions: string[];
  certifiedCentres: string[];
  recyclingReason: string;
}> {
  const prompt = `Product to analyze for recyclability:
Category: ${input.category}
Title: ${input.title}
Condition: ${input.condition}
Quality Grade: ${input.qualityGrade}

Provide detailed recycling analysis.`;

  try {
    const raw = await callGemini(RECYCLE_SYSTEM, prompt);
    const result = extractJSON(raw);
    return {
      isRecyclable: Boolean(result.isRecyclable),
      recycleScore: Math.max(0, Math.min(100, Number(result.recycleScore ?? 50))),
      materials: Array.isArray(result.materials) ? result.materials : [],
      parts: Array.isArray(result.parts) ? result.parts : [],
      environmentalImpact: result.environmentalImpact ?? { co2SavedKg: 0, waterSavedL: 0, energySavedKwh: 0 },
      instructions: Array.isArray(result.instructions) ? result.instructions : [],
      certifiedCentres: Array.isArray(result.certifiedCentres) ? result.certifiedCentres : [],
      recyclingReason: result.recyclingReason ?? "",
    };
  } catch (err) {
    console.error("Recycle analysis failed:", err);
    // Sensible fallback based on category
    const electronics = ["electronics", "appliances"].includes(input.category.toLowerCase());
    return {
      isRecyclable: true,
      recycleScore: electronics ? 72 : 60,
      materials: electronics
        ? [
            { name: "Plastic", percentage: 40, recyclable: true, color: "#3B82F6" },
            { name: "Metal", percentage: 30, recyclable: true, color: "#F59E0B" },
            { name: "Circuit Boards", percentage: 20, recyclable: false, color: "#EF4444" },
            { name: "Glass", percentage: 10, recyclable: true, color: "#22C55E" },
          ]
        : [
            { name: "Fabric", percentage: 60, recyclable: true, color: "#EC4899" },
            { name: "Plastic", percentage: 25, recyclable: true, color: "#3B82F6" },
            { name: "Metal", percentage: 15, recyclable: true, color: "#F59E0B" },
          ],
      parts: [],
      environmentalImpact: { co2SavedKg: 2.5, waterSavedL: 50, energySavedKwh: 8 },
      instructions: ["Remove battery if applicable", "Separate metal parts", "Drop at certified e-waste centre"],
      certifiedCentres: ["E-waste recycling centre", "Certified scrap dealer"],
      recyclingReason: "This product contains recyclable materials that can be recovered and reused, reducing landfill waste.",
    };
  }
}

// ─── P2P Photo Quality Analysis ───────────────────────────────────────────

const P2P_PHOTO_SYSTEM = `You are ReLoop's AI quality inspector for a P2P resale marketplace.
A seller has uploaded product photos (front, back, left side, right side, close-up/detail).
Your job: assess the product's resale condition fairly — like an experienced second-hand marketplace reviewer, not a perfectionist.

Return a JSON object with EXACTLY these fields:
{
  "sellable": true | false,
  "qualityGrade": "excellent" | "good" | "fair" | "poor",
  "qualityScore": <integer 0-100>,
  "verdict": "<one direct sentence — approved or rejected and why>",
  "positives": ["<observed strength>", ...],
  "concerns": ["<specific observed defect or issue>", ...],
  "aiReasoning": "<2-3 sentences of honest assessment the seller needs to hear>"
}

SCORING GUIDE:
- 85-100 → excellent: near-new condition, no meaningful defects, all parts intact
- 65-84  → good: normal signs of use — light surface scratches, minor scuffs, fully functional appearance
- 45-64  → fair: noticeable wear, visible scratches or small dents, but item is clearly still usable and structurally intact
- 0-44   → poor: cracked screen, broken/detached parts, heavy damage, burn marks, liquid damage, non-functional

WHAT TO IGNORE (do NOT penalise for these):
- Dust, fingerprints, or smudges visible in photos — these clean off
- Very minor surface marks or light scuffs that don't affect usability
- Slight bends on cables, straps, or flexible parts that are not broken
- Normal wear on corners or edges of older items
- Photo quality issues (shadows, angles) — judge the product, not the photo

REJECTION RULES (sellable=false, score ≤ 40) — only for genuine damage:
- Cracked or shattered screen or body
- Broken, snapped, or fully detached parts
- Heavy corrosion, burn marks, or liquid damage stains
- Missing critical components that make the item unusable
- Item is clearly destroyed or non-functional in appearance

SCORING RULES:
- Be fair, not harsh. A used item with normal wear should score 65-80.
- Only structural damage (cracks, breaks, missing parts) causes major score drops
- Surface dirt, dust, or minor scuffs = note as a positive ("easy to clean") not a penalty
- A small bend on a non-structural part ≠ broken — judge intent to deceive, not imperfection
- Reserve scores below 45 for items that genuinely cannot be sold as-is

CONCERNS: only list things that meaningfully affect resale value or usability
POSITIVES: highlight genuine strengths — intact screen, working ports, clean body, accessories present

Respond with ONLY the JSON object, no markdown, no explanation.`;

export async function aiAnalyzeP2PPhotos(imageUrls: string[], meta?: { category?: string; title?: string; condition?: string }): Promise<{
  sellable: boolean;
  qualityGrade: string;
  qualityScore: number;
  verdict: string;
  positives: string[];
  concerns: string[];
  aiReasoning: string;
  isRecyclable: boolean;
  recycleData: any;
}> {
  try {
    // Fetch all images as base64 for vision
    const imageData = await Promise.all(imageUrls.map((url) => fetchUrlAsBase64(url)));

    const angleLabels = ["Front View", "Back View", "Left Side", "Right Side", "Close-up/Detail"];

    const { text } = await generateText({
      model: gateway(MODEL),
      system: P2P_PHOTO_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these ${imageUrls.length} product photos from different angles to determine if this item is fit for P2P resale. Be thorough but fair.`,
            },
            ...imageData.map((img, i) => ({
              type: "image" as const,
              image: img.base64,
              mimeType: img.mimeType as any,
            })),
            {
              type: "text",
              text: `Photos are: ${angleLabels.slice(0, imageUrls.length).join(", ")}. Return your JSON analysis now.`,
            },
          ],
        },
      ],
      temperature: 0.2,
    });

    const result = extractJSON(text);
    const qualityGrade = result.qualityGrade ?? "good";
    const condition = meta?.condition ?? qualityGrade;

    // Run recyclability in parallel after we know the product details
    let recycleData: any = null;
    let isRecyclable = false;
    try {
      const recycle = await aiAnalyzeRecyclability({
        category: meta?.category ?? "other",
        title: meta?.title ?? "Product",
        condition,
        qualityGrade,
      });
      isRecyclable = recycle.isRecyclable;
      recycleData = recycle;
    } catch {}

    return {
      sellable: Boolean(result.sellable),
      qualityGrade,
      qualityScore: Math.max(0, Math.min(100, Number(result.qualityScore ?? 70))),
      verdict: result.verdict ?? (result.sellable ? "Product approved for listing." : "Product not ready for listing."),
      positives: Array.isArray(result.positives) ? result.positives : [],
      concerns: Array.isArray(result.concerns) ? result.concerns : [],
      aiReasoning: result.aiReasoning ?? "",
      isRecyclable,
      recycleData,
    };
  } catch (err) {
    console.error("P2P photo analysis failed:", err);
    return {
      sellable: false,
      qualityGrade: "poor",
      qualityScore: 0,
      verdict: "AI analysis failed — cannot verify product condition.",
      positives: [],
      concerns: ["AI could not process the photos. Please re-upload clear, well-lit images and try again."],
      aiReasoning: "Analysis failed. This could be due to blurry, dark, or unrecognisable images. Re-upload high quality photos and run the check again.",
      isRecyclable: false,
      recycleData: null,
    };
  }
}

// ─── AI Disposition ────────────────────────────────────────────────────────

const DISPOSITION_SYSTEM = `You are ReLoop's AI quality inspector. Analyze returned product submissions and determine the optimal second-life route.

Return a JSON object with EXACTLY these fields:
{
  "disposition": "resell" | "refurbish" | "donate" | "recycle" | "exchange",
  "qualityGrade": "excellent" | "good" | "fair" | "poor",
  "qualityScore": <integer 0-100>,
  "confidenceScore": <integer 0-100>,
  "greenCreditsAwarded": <integer, based on route: donate=75, resell=60, exchange=50, refurbish=35, recycle=20>,
  "aiReasoning": "<2-3 sentence explanation of the disposition decision and green credits awarded>"
}

Rules:
- "resell": item in near-original condition, can be listed directly
- "refurbish": minor defects, worth professional restoration
- "donate": good condition, high social value, or affordable alternatives exist
- "recycle": significant damage, not safe/viable to resell
- "exchange": customer wants to swap, good condition
- greenCreditsAwarded must exactly match the route values above
- aiReasoning should be encouraging, explain why the route was chosen, mention green credits
- Respond with ONLY the JSON object, no markdown, no explanation`;

export async function aiDispose(input: {
  category: string;
  brand: string;
  purchaseDate: string;
  returnReason: string;
  description?: string;
}): Promise<{
  disposition: string;
  qualityGrade: string;
  qualityScore: number;
  confidenceScore: number;
  greenCreditsAwarded: number;
  aiReasoning: string;
}> {
  const prompt = `Product return submission:
Category: ${input.category}
Brand: ${input.brand}
Purchase Date: ${input.purchaseDate}
Return Reason: ${input.returnReason}
${input.description ? `Additional Info: ${input.description}` : ""}

Analyze this return and provide disposition routing.`;

  try {
    const raw = await callGemini(DISPOSITION_SYSTEM, prompt);
    const result = extractJSON(raw);
    if (!result.disposition || !result.qualityGrade || result.qualityScore === undefined) {
      throw new Error("Invalid AI response structure");
    }
    return {
      disposition: result.disposition,
      qualityGrade: result.qualityGrade,
      qualityScore: Math.max(0, Math.min(100, Number(result.qualityScore))),
      confidenceScore: Math.max(0, Math.min(100, Number(result.confidenceScore ?? 85))),
      greenCreditsAwarded: Number(result.greenCreditsAwarded ?? 50),
      aiReasoning: result.aiReasoning ?? "",
    };
  } catch (err) {
    console.error("AI disposition failed, using fallback:", err);
    return fallbackDispose(input);
  }
}

function fallbackDispose(input: { category: string; brand: string; returnReason: string; purchaseDate: string }) {
  const reason = input.returnReason.toLowerCase();
  if (reason.includes("defect") || reason.includes("broken") || reason.includes("damage")) {
    return { disposition: "recycle", qualityGrade: "poor", qualityScore: 30, confidenceScore: 90, greenCreditsAwarded: 20, aiReasoning: "Physical damage detected. Routing to certified recycling. You earn 20 Green Credits." };
  }
  if (reason.includes("scratch") || reason.includes("wear")) {
    return { disposition: "refurbish", qualityGrade: "fair", qualityScore: 55, confidenceScore: 85, greenCreditsAwarded: 35, aiReasoning: "Minor cosmetic wear detected. Routing to certified refurbishment. You earn 35 Green Credits." };
  }
  if (reason.includes("gift") || reason.includes("duplicate")) {
    return { disposition: "exchange", qualityGrade: "excellent", qualityScore: 95, confidenceScore: 92, greenCreditsAwarded: 50, aiReasoning: "Excellent condition item. Exchange program recommended. You earn 50 Green Credits." };
  }
  if (reason.includes("size") || reason.includes("fit")) {
    return { disposition: "resell", qualityGrade: "excellent", qualityScore: 92, confidenceScore: 96, greenCreditsAwarded: 60, aiReasoning: "Item in original condition, size mismatch only. Routing to certified resell. You earn 60 Green Credits." };
  }
  return { disposition: "resell", qualityGrade: "good", qualityScore: 80, confidenceScore: 85, greenCreditsAwarded: 50, aiReasoning: `Good condition ${input.brand} ${input.category}. Routing to certified resell marketplace. You earn 50 Green Credits.` };
}

// ─── Return Prevention AI ──────────────────────────────────────────────────

const PREVENTION_SYSTEM = `You are ReLoop's advanced return prevention AI and purchase intelligence engine. Analyze purchase intent deeply and return a comprehensive analysis.

Return a JSON object with EXACTLY these fields:
{
  "riskScore": <integer 0-100>,
  "riskLevel": "low" | "medium" | "high",
  "confidenceScore": <integer 0-100>,
  "fitScore": <integer 0-100>,
  "riskDrivers": ["<specific risk driver 1>", "<specific risk driver 2>", "<specific risk driver 3>"],
  "positiveSignals": ["<positive signal 1>", "<positive signal 2>"],
  "confidenceReasons": ["<reason confidence is high/low 1>", "<reason 2>"],
  "areasOfConcern": ["<area of concern 1>", "<area of concern 2>"],
  "fitReasons": ["<why fit score is what it is 1>", "<reason 2>", "<reason 3>"],
  "reviewInsights": {
    "positiveThemes": [
      {"theme": "<theme name>", "count": <integer 1-200>, "examples": ["<example review phrase>", "<example 2>"]},
      {"theme": "<theme name>", "count": <integer 1-200>, "examples": ["<example>"]},
      {"theme": "<theme name>", "count": <integer 1-200>, "examples": ["<example>"]}
    ],
    "negativeThemes": [
      {"theme": "<theme name>", "count": <integer 1-200>, "examples": ["<example review phrase>", "<example 2>"]},
      {"theme": "<theme name>", "count": <integer 1-200>, "examples": ["<example>"]},
      {"theme": "<theme name>", "count": <integer 1-200>, "examples": ["<example>"]}
    ],
    "topReturnReasons": [
      {"reason": "<return reason>", "percentage": <integer 5-60>},
      {"reason": "<return reason>", "percentage": <integer 5-60>},
      {"reason": "<return reason>", "percentage": <integer 5-60>}
    ]
  },
  "returnCostImpact": {
    "shippingCostINR": <integer>,
    "processingCostINR": <integer>,
    "totalCostINR": <integer>,
    "co2KgEmitted": <number with 1 decimal>
  },
  "preventionChecklist": [
    {"item": "<actionable checklist item>", "riskReductionPoints": <integer 2-15>},
    {"item": "<actionable checklist item>", "riskReductionPoints": <integer 2-15>},
    {"item": "<actionable checklist item>", "riskReductionPoints": <integer 2-15>},
    {"item": "<actionable checklist item>", "riskReductionPoints": <integer 2-15>},
    {"item": "<actionable checklist item>", "riskReductionPoints": <integer 2-15>}
  ],
  "personalizedRisk": {
    "genericRisk": <integer 0-100>,
    "userRisk": <integer 0-100>,
    "differenceExplanation": "<1-2 sentences explaining why user risk differs from generic>"
  },
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"],
  "alternatives": [
    {"title": "<alt title>", "reason": "<why this alternative>", "savingsPercent": <integer>},
    {"title": "<alt title>", "reason": "<why this alternative>", "savingsPercent": <integer>},
    {"title": "<alt title>", "reason": "<why this alternative>", "savingsPercent": <integer>}
  ],
  "assistantContext": "<2-3 sentence summary of this product's key risks and benefits for AI assistant context>"
}

Rules:
- riskScore 0-39=low, 40-69=medium, 70-100=high
- confidenceScore: how confident a buyer should be (inverse isn't always exact opposite of risk)
- fitScore: how well the product fits typical buyer needs for this category/price/brand
- riskDrivers: specific actionable reasons for return risk (e.g. "Frequent size complaints in reviews", "Known compatibility issues with older OS versions")
- positiveSignals: genuine strengths (e.g. "Strong brand reputation", "Excellent customer satisfaction score")
- reviewInsights: simulate realistic review intelligence for this product type — make themes specific to the category
- returnCostImpact: realistic Indian shipping (₹150-400), processing (₹100-200), total, CO2 for return shipment
- preventionChecklist: specific, actionable items a buyer should verify before purchasing
- personalizedRisk: if userQuery/budget/intendedUse provided, calculate personalized vs generic risk
- Be data-rich, specific, and explainable
- Respond with ONLY the JSON object, no markdown, no explanation`;

export async function aiPreventReturn(input: {
  category: string;
  brand: string;
  price: number;
  productName?: string;
  userQuery?: string;
  budget?: number;
  intendedUse?: string;
  experienceLevel?: string;
}): Promise<{
  riskScore: number;
  riskLevel: string;
  confidenceScore: number;
  fitScore: number;
  riskDrivers: string[];
  positiveSignals: string[];
  confidenceReasons: string[];
  areasOfConcern: string[];
  fitReasons: string[];
  reviewInsights: {
    positiveThemes: { theme: string; count: number; examples: string[] }[];
    negativeThemes: { theme: string; count: number; examples: string[] }[];
    topReturnReasons: { reason: string; percentage: number }[];
  };
  returnCostImpact: { shippingCostINR: number; processingCostINR: number; totalCostINR: number; co2KgEmitted: number };
  preventionChecklist: { item: string; riskReductionPoints: number }[];
  personalizedRisk: { genericRisk: number; userRisk: number; differenceExplanation: string };
  recommendations: string[];
  alternatives: { title: string; reason: string; savingsPercent: number }[];
  assistantContext: string;
  // legacy
  reasons: string[];
}> {
  const prompt = `Purchase intent analysis:
Product: ${input.productName ?? "Unknown"}
Category: ${input.category}
Brand: ${input.brand}
Price: ₹${input.price}
${input.budget ? `Budget: ₹${input.budget}` : ""}
${input.intendedUse ? `Intended Use: ${input.intendedUse}` : ""}
${input.experienceLevel ? `Experience Level: ${input.experienceLevel}` : ""}
${input.userQuery ? `Customer concern: ${input.userQuery}` : ""}

Generate comprehensive return risk and purchase intelligence analysis.`;

  try {
    const raw = await callGemini(PREVENTION_SYSTEM, prompt);
    const result = extractJSON(raw);
    return {
      riskScore: Math.max(0, Math.min(100, Number(result.riskScore ?? 30))),
      riskLevel: result.riskLevel ?? "low",
      confidenceScore: Math.max(0, Math.min(100, Number(result.confidenceScore ?? 70))),
      fitScore: Math.max(0, Math.min(100, Number(result.fitScore ?? 75))),
      riskDrivers: Array.isArray(result.riskDrivers) ? result.riskDrivers : [],
      positiveSignals: Array.isArray(result.positiveSignals) ? result.positiveSignals : [],
      confidenceReasons: Array.isArray(result.confidenceReasons) ? result.confidenceReasons : [],
      areasOfConcern: Array.isArray(result.areasOfConcern) ? result.areasOfConcern : [],
      fitReasons: Array.isArray(result.fitReasons) ? result.fitReasons : [],
      reviewInsights: result.reviewInsights ?? { positiveThemes: [], negativeThemes: [], topReturnReasons: [] },
      returnCostImpact: result.returnCostImpact ?? { shippingCostINR: 250, processingCostINR: 150, totalCostINR: 400, co2KgEmitted: 2.4 },
      preventionChecklist: Array.isArray(result.preventionChecklist) ? result.preventionChecklist : [],
      personalizedRisk: result.personalizedRisk ?? { genericRisk: result.riskScore ?? 30, userRisk: result.riskScore ?? 30, differenceExplanation: "No personalization data provided." },
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      alternatives: Array.isArray(result.alternatives) ? result.alternatives : [],
      assistantContext: result.assistantContext ?? "",
      reasons: Array.isArray(result.riskDrivers) ? result.riskDrivers : [],
    };
  } catch (err) {
    console.error("AI prevention failed, using fallback:", err);
    return fallbackPrevention(input);
  }
}

function fallbackPrevention(input: { category: string; price: number; budget?: number; intendedUse?: string }) {
  let riskScore = 30;
  const riskDrivers: string[] = [];
  const positiveSignals: string[] = ["Established product category", "Standard return policies apply"];
  const recommendations: string[] = ["Review product specifications carefully", "Check recent customer reviews", "Verify compatibility with your existing setup"];

  if (input.category === "clothing" || input.category === "footwear") {
    riskScore += 25;
    riskDrivers.push("Size and fit is the #1 return reason for this category");
    riskDrivers.push("Color accuracy may vary from display to actual product");
  }
  if (input.price > 10000) {
    riskScore += 10;
    riskDrivers.push("High-value purchases have higher reconsideration rates");
  }
  if (input.budget && input.price > input.budget * 1.2) {
    riskScore += 15;
    riskDrivers.push("Product price exceeds stated budget — buyer's remorse risk");
  }

  riskScore = Math.min(riskScore, 95);
  const riskLevel = riskScore >= 60 ? "high" : riskScore >= 40 ? "medium" : "low";
  const confidenceScore = Math.max(20, 100 - riskScore + 10);
  const fitScore = Math.max(30, 85 - (riskScore / 3));

  return {
    riskScore,
    riskLevel,
    confidenceScore,
    fitScore,
    riskDrivers,
    positiveSignals,
    confidenceReasons: ["Based on category and price analysis", "Standard buyer profile match"],
    areasOfConcern: riskDrivers.slice(0, 2),
    fitReasons: ["Matches common use cases for this category", "Price within typical market range"],
    reviewInsights: {
      positiveThemes: [
        { theme: "Good Value", count: 142, examples: ["Great for the price", "Worth every rupee"] },
        { theme: "Durable Build", count: 89, examples: ["Still working after months"] },
      ],
      negativeThemes: [
        { theme: "Size Issues", count: 67, examples: ["Runs small", "Not true to size"] },
        { theme: "Packaging Damage", count: 34, examples: ["Arrived dented"] },
      ],
      topReturnReasons: [
        { reason: "Size/Fit Mismatch", percentage: 38 },
        { reason: "Quality Expectations", percentage: 27 },
        { reason: "Compatibility Issues", percentage: 18 },
      ],
    },
    returnCostImpact: { shippingCostINR: 250, processingCostINR: 150, totalCostINR: 400, co2KgEmitted: 2.4 },
    preventionChecklist: [
      { item: "Verify exact dimensions/size before ordering", riskReductionPoints: 12 },
      { item: "Read at least 10 recent customer reviews", riskReductionPoints: 8 },
      { item: "Confirm compatibility with your current devices", riskReductionPoints: 10 },
      { item: "Check warranty and after-sales support", riskReductionPoints: 5 },
      { item: "Compare with at least one alternative product", riskReductionPoints: 7 },
    ],
    personalizedRisk: {
      genericRisk: riskScore,
      userRisk: input.budget && input.price > input.budget ? riskScore + 12 : riskScore,
      differenceExplanation: "Your risk is based on general category patterns. Providing your budget and intended use improves accuracy.",
    },
    recommendations,
    alternatives: [
      { title: "Certified Refurbished Version", reason: "Same product, 30-40% cheaper, quality guaranteed", savingsPercent: 35 },
      { title: "ReLoop Exchange Program", reason: "Exchange your current product instead of buying new", savingsPercent: 20 },
      { title: "ReLoop P2P Marketplace", reason: "Buy from verified peer sellers at lower prices", savingsPercent: 45 },
    ],
    assistantContext: `This is a ${input.category} purchase. Key risks include fit/compatibility concerns. Risk level is ${riskLevel} at ${riskScore}%.`,
    reasons: riskDrivers,
  };
}

// ─── AI Shopping Assistant ─────────────────────────────────────────────────

export async function aiShoppingAssistant(input: {
  question: string;
  context: string;
}): Promise<string> {
  const system = `You are ReLoop's AI Shopping Assistant embedded inside Return Shield — a purchase intelligence tool.
You have been given a full analysis context about a specific product the user is considering buying.
Answer the user's question using the analysis context. Be concise (2-4 sentences max), direct, and helpful.
If the question is outside the context, use general knowledge about the product category.
Never repeat the same answer — always tailor to the exact question asked.
Do NOT use markdown, bullet points, or formatting. Plain conversational text only.`;

  const prompt = `Analysis context:
${input.context}

User's question: ${input.question}

Answer directly and helpfully based on the analysis above.`;

  try {
    return await callGemini(system, prompt);
  } catch {
    return "I couldn't process that right now. Please try rephrasing your question.";
  }
}
