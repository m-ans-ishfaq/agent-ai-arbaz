const express = require("express");
const cors = require("cors");
const axios = require("axios");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = "AIzaSyCfQn1aMgpILJfgKac2frcllzVYnGkFqCs";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const OPENSEARCH_URL = "https://localhost:9200"; // OpenSearch URL (HTTPS)
const OPENSEARCH_USER = "admin"; // OpenSearch credentials
const OPENSEARCH_PASSWORD = "nqwklXklwn6342$!@";

// Load SSL certificate files
const options = {
  key: fs.readFileSync(path.resolve("../certs/localhost-key.pem")), // Private key
  cert: fs.readFileSync(path.resolve("../certs/localhost.pem")), // Your certificate file
  rejectUnauthorized: false, // Disable certificate validation (use with caution)
};

// Create an axios instance with custom https.Agent to disable SSL verification
const axiosInstance = axios.create({
  baseURL: OPENSEARCH_URL,
  auth: {
    username: OPENSEARCH_USER,
    password: OPENSEARCH_PASSWORD,
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Ignore SSL verification
  }),
});

app.post("/api/submit", async (req, res) => {
  const userQuery = req.body.text;
  console.log("Received text:", userQuery);

  try {
    // Request OpenAI to generate OpenSearch query in JSON format
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: userQuery,
      config: {
        systemInstruction: `You convert natural language into OpenSearch JSON queries. Respond ONLY with pure JSON. Do not explain anything. No markdown. No formatting. No strings. Just valid JSON. The schema for the 'orders' index is as follows: The 'orders' index has the following fields - 'id' (integer, unique identifier), 'name' (string), 'location' (string), 'total' (numeric). You should only generate queries related to the 'orders' data, using these fields. Also don't use bool with must, prefer using match`,
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

    const parsedQuery = JSON.parse(jsonString);
    console.log("Query", JSON.stringify(parsedQuery));
    const opensearchRes = await axiosInstance.post(
      "/orders/_search",
      parsedQuery
    );
    res.json(opensearchRes.data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process request." });
  }
});

app.post('/api/fill-data', async (req, res) => {
  try {
    const dummyData = [
      { id: 1, name: 'John Doe', location: 'New York', total: 600 },
      { id: 2, name: 'Jane Doe', location: 'San Francisco', total: 450 },
      { id: 3, name: 'Michael Smith', location: 'Los Angeles', total: 750 },
      { id: 4, name: 'Emily Davis', location: 'New York', total: 300 },
      { id: 5, name: 'David Johnson', location: 'Chicago', total: 900 }
    ];

    // Insert dummy data into OpenSearch index
    for (const data of dummyData) {
      await axiosInstance.post(`/orders/_doc`, data);
    }

    res.status(200).send('Dummy data filled successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error filling data.');
  }
});

// 2. Endpoint to remove all data
app.post('/api/remove-data', async (req, res) => {
  try {
    const response = await axiosInstance.post(`/orders/_delete_by_query`, {
      query: { match_all: {} }
    });

    res.status(200).send('Data removed successfully.');
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Error removing data.');
  }
});

// Start the HTTPS server
https.createServer(options, app).listen(3001, () => {
  console.log("HTTPS server is running at https://localhost:3001");
});
