const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const citiesData = require('./cities.json');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: 'http://localhost:4200',
};

app.use(cors(corsOptions));

// Function to load data into Elasticsearch from JSON
async function loadData() {
  try {
    const client = new Client({ node: 'http://localhost:9200' });
    const indexName = 'smart-cities';

    // Check if the index exists
    const indexExists = await client.indices.exists({ index: indexName });

    if (indexExists) {
      // Delete the index if it exists
      await client.indices.delete({ index: indexName });
    }

    // Create the index if it doesn't exist
    await client.indices.create({ index: indexName });

    // Define the mapping for the index
    const mapping = {
      properties: {
        name: { type: 'text' },
        state: { type: 'text' },
        population: { type: 'integer' },
        latitude: { type: 'float' },
        longitude: { type: 'float' }
      }
    };

    // Set the mapping for the index
    await client.indices.putMapping({
      index: indexName,
      body: mapping
    });

    // Bulk index the data
    const body = citiesData.flatMap((city) => [
      { index: { _index: indexName } },
      city
    ]);

    await client.bulk({ refresh: true, body });

    console.log('Data loaded successfully into Elasticsearch.');
  } catch (error) {
    console.error('Error occurred while loading data into Elasticsearch:', error);
  }
}

// Endpoint for performing full-text search
app.get('/cities/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter.' });
    }

    const client = new Client({ node: 'http://localhost:9200' });
    const indexName = 'smart-cities';

    const body = await client.search({
      index: indexName,
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: q,
                  fields: ["name", "state"],
                  fuzziness: 'AUTO'
                }
              },
              {
                prefix: {
                  name: {
                    value: q.toLowerCase()
                  }
                }
              }
            ]
          }
        }
      }
    });    

    console.log('Elasticsearch response:', body);

    if (!body) {
      console.error('Empty response received from Elasticsearch.');
      return res.status(500).json({ error: 'An error occurred while searching for cities.' });
    }

    if (body.error) {
      console.error('Error occurred while searching for cities:', body.error);
      return res.status(500).json({ error: 'An error occurred while searching for cities.' });
    }

    const results = body.hits.hits.map((hit) => hit._source);
    res.json(results);
  } catch (error) {
    console.error('Error occurred while searching for cities:', error);
    res.status(500).json({ error: 'An error occurred while searching for cities.' });
  }
});

// Endpoint for fetching city details
app.get('/cities/details', (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'Missing city parameter.' });
    }

    // Replace this with your actual logic to fetch city details
    const cityDetails = citiesData.find((c) => c.name.toLowerCase() === city.toLowerCase());

    if (!cityDetails) {
      return res.status(404).json({ error: 'City details not found.' });
    }

    res.json(cityDetails);
  } catch (error) {
    console.error('Error occurred while fetching city details:', error);
    res.status(500).json({ error: 'An error occurred while fetching city details.' });
  }
});

// Load data into Elasticsearch on server start
loadData();

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
