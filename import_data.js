#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Fetch function for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Parse CSV content into array of objects
 */
function parseCSV(csvContent) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;
  
  // First, properly split the CSV into lines, respecting quoted fields
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    
    if (char === '"') {
      if (inQuotes && csvContent[i + 1] === '"') {
        // Escaped quote
        currentLine += '""';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !inQuotes) {
      // End of line (not in quotes)
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  // Add the last line if it exists
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    
    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line handling quotes and commas
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Start or end of quoted field
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  values.push(current);
  return values;
}

/**
 * Convert CSV row to hunt data structure
 */
function csvRowToHunt(row) {
  const huntTitle = (row.hunt_title || '').trim();
  if (!huntTitle) {
    throw new Error('Missing or empty hunt_title in CSV row');
  }

  const treasures = [];
  let treasureIndex = 1;

  // Extract treasures from clue_N/qr_data_N pairs
  while (row[`clue_${treasureIndex}`] || row[`qr_data_${treasureIndex}`]) {
    const clueText = (row[`clue_${treasureIndex}`] || '').trim();
    const qrData = (row[`qr_data_${treasureIndex}`] || '').trim();

    // Only add treasure if it has a clue (skip empty treasures)
    if (clueText) {
      treasures.push({
        ordinal: treasureIndex,
        clueText: clueText,
        qrCodeData: qrData || undefined
      });
    }

    treasureIndex++;
  }

  return {
    title: huntTitle,
    treasures
  };
}

/**
 * Fetch all hunts from API
 */
async function fetchHunts() {
  try {
    const response = await fetch(`${API_BASE_URL}/hunts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching hunts:', error.message);
    throw error;
  }
}

/**
 * Delete a hunt via API
 */
async function deleteHunt(huntId) {
  try {
    const response = await fetch(`${API_BASE_URL}/hunts/${huntId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting hunt ${huntId}:`, error.message);
    throw error;
  }
}

/**
 * Create a new hunt via API
 */
async function createHunt(huntData) {
  try {
    const response = await fetch(`${API_BASE_URL}/hunts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(huntData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating hunt:', error.message);
    throw error;
  }
}

/**
 * Clear all existing hunts
 */
async function clearDatabase() {
  console.log('🗑️  Clearing existing hunts...');
  
  const hunts = await fetchHunts();
  console.log(`   Found ${hunts.length} existing hunt(s) to delete`);

  for (const hunt of hunts) {
    console.log(`   🗑️  Deleting "${hunt.title}"...`);
    await deleteHunt(hunt.id);
  }

  console.log('✅ Database cleared successfully');
}

/**
 * Import hunts from CSV data
 */
async function importHunts(csvData) {
  console.log(`📥 Importing ${csvData.length} hunt(s)...`);
  
  const createdHunts = [];

  for (const row of csvData) {
    try {
      const huntData = csvRowToHunt(row);
      
      console.log(`   🏴‍☠️ Creating "${huntData.title}" (${huntData.treasures.length} treasures)...`);
      
      const createdHunt = await createHunt(huntData);
      createdHunts.push(createdHunt);
      
    } catch (error) {
      console.error(`   ❌ Failed to create hunt from row:`, row);
      console.error(`      Error: ${error.message}`);
      throw error;
    }
  }

  return createdHunts;
}

/**
 * Main import function
 */
async function importData(csvFilePath) {
  console.log('🏴‍☠️ Starting treasure hunt data import...');
  console.log(`📡 Connecting to API at ${API_BASE_URL}`);
  console.log(`📄 Reading CSV file: ${csvFilePath}`);

  try {
    // Validate file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    // Read and parse CSV
    console.log('📋 Parsing CSV file...');
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const csvData = parseCSV(csvContent);
    
    if (csvData.length === 0) {
      console.log('⚠️  CSV file contains no data rows');
      return;
    }

    console.log(`✅ Parsed ${csvData.length} row(s) from CSV`);

    // Clear existing database
    await clearDatabase();

    // Import new data
    const createdHunts = await importHunts(csvData);

    console.log('🎉 Import completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   📄 File: ${path.resolve(csvFilePath)}`);
    console.log(`   📋 Hunts created: ${createdHunts.length}`);
    console.log(`   📦 Total treasures: ${createdHunts.reduce((sum, hunt) => sum + (hunt.treasures?.length || 0), 0)}`);

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('🔧 Make sure the backend server is running on localhost:3001');
    } else if (error.message.includes('ENOENT')) {
      console.error('📄 Make sure the CSV file path is correct');
    }
    
    process.exit(1);
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  console.log('🏴‍☠️ Treasure Hunt Data Importer');
  console.log('=================================');

  const csvFilePath = process.argv[2];
  
  if (!csvFilePath) {
    console.error('❌ Usage: node import_data.js <csv_file_path>');
    console.error('   Example: node import_data.js treasure_export.csv');
    console.error('   Example: yarn data:import treasure_export.csv');
    process.exit(1);
  }

  importData(csvFilePath).catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { importData, parseCSV, csvRowToHunt };