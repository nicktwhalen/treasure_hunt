import '@testing-library/jest-dom'

// Note: next/navigation mock is now handled in individual test files

// Mock the API
jest.mock('./src/lib/api', () => ({
  api: {
    getHunt: jest.fn(),
    getTreasures: jest.fn(),
    updateHunt: jest.fn(),
    createHunt: jest.fn(),
    getTreasureQrUrl: jest.fn(),
  },
}))