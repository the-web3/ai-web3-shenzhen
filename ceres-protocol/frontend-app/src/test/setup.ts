import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.ethereum for Web3 tests
Object.defineProperty(window, "ethereum", {
  writable: true,
  value: {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    isMetaMask: true,
  },
});

// Mock environment variables
vi.mock("import.meta", () => ({
  env: {
    VITE_HASHKEY_RPC_URL: "https://hashkeychain-testnet.alt.technology",
    VITE_HASHKEY_CHAIN_ID: "133",
    VITE_CERES_GREEN_POINTS_ADDRESS:
      "0x1234567890123456789012345678901234567890",
    VITE_CERES_REGISTRY_ADDRESS: "0x2345678901234567890123456789012345678901",
    VITE_CERES_MARKET_FACTORY_ADDRESS:
      "0x3456789012345678901234567890123456789012",
  },
}));

// Global test utilities
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Chart.js for component tests
vi.mock("chart.js", () => ({
  Chart: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { datasets: [] },
  })),
  registerables: [],
}));

vi.mock("react-chartjs-2", () => ({
  Line: vi.fn(() => null),
  Bar: vi.fn(() => null),
  Doughnut: vi.fn(() => null),
  Pie: vi.fn(() => null),
}));
