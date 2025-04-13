const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3002;

// OpenSearch URL and credentials
const OPENSEARCH_URL = 'https://localhost:9200';
const OPENSEARCH_USER = 'admin'; // Default username (unless changed)
const OPENSEARCH_PASSWORD = 'nqwklXklwn6342*^&('; // Your password

// Load SSL certificate files
const options = {
    key: fs.readFileSync(path.resolve("../certs/localhost-key.pem")), // Private key
      cert: fs.readFileSync(path.resolve("../certs/localhost.pem")), // Your certificate file
  rejectUnauthorized: false  // Disable certificate validation (use with caution)
};

// Create an axios instance with custom https.Agent to disable SSL verification
const axiosInstance = axios.create({
  baseURL: OPENSEARCH_URL,
  auth: {
    username: OPENSEARCH_USER,
    password: OPENSEARCH_PASSWORD
  },
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false // Ignore SSL verification
  })
});

app.get("/api", async (req, res) => {
    try {
        const r = await axiosInstance.get("/");
        res.send(r.data);
    } catch (err) 
    {
        res.send(err)
    }
    // res.send("hello")
});


// 1. Endpoint to fill data with dummy records
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
    // Delete all documents in the 'orders' index
    await axiosInstance.delete(`/orders/_delete_by_query`, {
      data: { query: { match_all: {} } }
    });

    res.status(200).send('Data removed successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error removing data.');
  }
});

// 3. Endpoint to pass an OpenSearch query and see the results
app.post('/api/query', async (req, res) => {
  try {
    // Example OpenSearch query (hardcoded)
    const query = {
      query: {
        range: {
          total: { gt: 500 }
        }
      }
    };

    // Send the query to OpenSearch
    const response = await axiosInstance.post(
      `/orders/_search`,
      query
    );

    // Return the search results
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error executing query.');
  }
});

// Start the HTTPS server
https.createServer(options, app).listen(port, () => {
  console.log(`HTTPS server is running at https://localhost:${port}`);
});
