import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = "AIzaSyCfQn1aMgpILJfgKac2frcllzVYnGkFqCs";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: "Get me orders from new york with totals below 500 and name starting from capital j",
    config: {
      systemInstruction: `You convert natural language into OpenSearch JSON queries. Respond ONLY with pure JSON. Do not explain anything. No markdown. No formatting. No strings. Just valid JSON. The schema for the 'orders' index is as follows: The 'orders' index has the following fields - 'id' (integer, unique identifier), 'name' (string), 'location' (string), 'total' (numeric). You should only generate queries related to the 'orders' data, using these fields.`,
    },
  });
  let jsonString = response.text;

  // Remove ```json and ``` if they exist
  if (jsonString.startsWith("```json")) {
    jsonString = jsonString.substring(7); // Remove "```json"
  }
  if (jsonString.endsWith("```")) {
    jsonString = jsonString.slice(0, -3); // remove "```"
  }

  try {
    const jsonOutput = JSON.parse(jsonString);
    console.log(JSON.stringify(jsonOutput, null, 2)); // Print formatted JSON
  } catch (error) {
    console.error("Error parsing JSON:", error);
    console.log("Raw response text:", jsonString); // print cleaned string.
  }
}

main();
