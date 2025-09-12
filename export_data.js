#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const OUTPUT_FILE = 'treasure_export.csv';

// Fetch function for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Fetch all hunts from the API
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
 * Fetch treasures for a specific hunt
 */
async function fetchTreasures(huntId) {
  try {
    const response = await fetch(`${API_BASE_URL}/hunts/${huntId}/treasures`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching treasures for hunt ${huntId}:`, error.message);
    throw error;
  }
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSV(field) {
  if (field == null) return '';
  
  const str = String(field);
  
  // If the field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

/**
 * Generate CSV headers based on maximum treasure count
 */
function generateHeaders(maxTreasures) {
  const headers = ['hunt_title'];
  
  for (let i = 1; i <= maxTreasures; i++) {
    headers.push(`clue_${i}`);
    headers.push(`qr_data_${i}`);
  }
  
  return headers;
}

/**
 * Convert hunt data to CSV row
 */
function huntToCSVRow(hunt, treasures, maxTreasures) {
  const row = [escapeCSV((hunt.title || '').trim())];
  
  // Sort treasures by ordinal to ensure correct order
  const sortedTreasures = treasures.sort((a, b) => a.ordinal - b.ordinal);
  
  for (let i = 0; i < maxTreasures; i++) {
    const treasure = sortedTreasures[i];
    
    if (treasure) {
      // Add clue text (handle nested clue object)
      const clueText = (treasure.clue?.text || '').trim();
      row.push(escapeCSV(clueText));
      
      // Add QR code data
      const qrData = (treasure.qrCodeData || '').trim();
      row.push(escapeCSV(qrData));
    } else {
      // Empty columns for missing treasures
      row.push('');
      row.push('');
    }
  }
  
  return row;
}

/**
 * Main export function
 */
async function exportData() {
  console.log('🏴‍☠️ Starting treasure hunt data export...');
  console.log(`📡 Connecting to API at ${API_BASE_URL}`);
  
  try {
    // Fetch all hunts
    console.log('📋 Fetching hunts...');
    const hunts = await fetchHunts();
    console.log(`✅ Found ${hunts.length} hunt(s)`);
    
    if (hunts.length === 0) {
      console.log('⚠️  No hunts found. Creating empty CSV file.');
      fs.writeFileSync(OUTPUT_FILE, 'hunt_title\n');
      return;
    }
    
    // Fetch treasures for each hunt
    console.log('📦 Fetching treasures for each hunt...');
    const huntData = [];
    let maxTreasures = 0;
    
    for (const hunt of hunts) {
      console.log(`  📍 Fetching treasures for "${hunt.title}"...`);
      const treasures = await fetchTreasures(hunt.id);
      console.log(`     Found ${treasures.length} treasure(s)`);
      
      huntData.push({ hunt, treasures });
      maxTreasures = Math.max(maxTreasures, treasures.length);
    }
    
    console.log(`📊 Maximum treasures per hunt: ${maxTreasures}`);
    
    // Generate CSV
    console.log('📝 Generating CSV...');
    const headers = generateHeaders(maxTreasures);
    const csvLines = [headers.join(',')];
    
    for (const { hunt, treasures } of huntData) {
      const row = huntToCSVRow(hunt, treasures, maxTreasures);
      csvLines.push(row.join(','));
    }
    
    const csvContent = csvLines.join('\n');
    
    // Write to file
    console.log(`💾 Writing to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, csvContent);
    
    console.log('🎉 Export completed successfully!');
    console.log(`📄 File: ${path.resolve(OUTPUT_FILE)}`);
    console.log(`📏 Records: ${huntData.length} hunt(s)`);
    console.log(`📋 Columns: ${headers.length} (hunt_title + ${maxTreasures} treasure pairs)`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('🔧 Make sure the backend server is running on localhost:3001');
    }
    
    process.exit(1);
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  console.log('🏴‍☠️ Treasure Hunt Data Exporter');
  console.log('================================');
  
  exportData().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { exportData, fetchHunts, fetchTreasures };