const { Client } = require('@elastic/elasticsearch');
const citiesData = require('./cities.json');

// Elasticsearch client
const client = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'ZRQO47v5N7gwu*OSMaXo',
  }
});

// Function to load data into Elasticsearch
async function loadData() {
  try {
    console.log('Starting data population...');

    // Check if the index exists
    const indexExists = await client.indices.exists({ index: 'smart-cities' });
    if (indexExists) {
      // Delete the index if it exists
      await client.indices.delete({ index: 'smart-cities' });
    }
    // Create the index if it doesn't exist
    await client.indices.create({ index: 'smart-cities' });

    // Define the bulk request body
    const bulkBody = [];
    for (const city of citiesData) {
      bulkBody.push({
        index: { _index: 'smart-cities' },
      });
      bulkBody.push(city);
    }

    
    // Perform the bulk indexing
    const { body: bulkResponse } = await client.bulk({ body: bulkBody });
    console.log('Bulk response:', bulkResponse);

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            index: i,
            error: action[operation].error,
          });
        }
      });

      console.log('Data population completed with errors:', erroredDocuments);
    } else {
      console.log('Data has been successfully populated into Elasticsearch');
    }
  } catch (error) {
    console.error('An error occurred while populating data:', error);
  }
}

// Call the function to load data
loadData();
