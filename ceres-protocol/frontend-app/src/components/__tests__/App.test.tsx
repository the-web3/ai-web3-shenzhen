import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { App } from "../../App";

// Mock all the hooks and components
vi.mock("@/hooks/useWeb3", () => ({
  useWeb3: vi.fn(),
  useNetworkStatus: vi.fn(),
}));

vi.mock("@/components/WalletConnect", () => ({
  WalletConnect: () => <div data-testid="wallet-connect">Wallet Connect</div>,
}));

vi.mock("@/components/JudgmentSubmission", () => ({
  JudgmentSubmission: ({ onSubmit }: { onSubmit: (data: any) => void }) => (
    <div data-testid="judgment-submission">
      <button onClick={() => onSubmit({ test: "data" })}>
        Submit Judgment
      </button>
    </div>
  ),
}));

vi.mock("@/components/MarketList", () => ({
  MarketList: ({
    onTrade,
  }: {
    onTrade: (marketId: string, isYes: boolean, amount: number) => void;
  }) => (
    <div data-testid="market-list">
      <button onClick={() => onTrade("test-market", true, 1.0)}>
        Trade Market
      </button>
    </div>
  ),
}));

vi.mock("@/components/UserStats", () => ({
  UserStats: ({ userStats }: { userStats?: any }) => (
    <div data-testid="user-stats">
      {userStats ? "User Stats Loaded" : "No User Stats"}
    </div>
  ),
}));

import { useWeb3, useNetworkStatus } from "@/hooks/useWeb3";

const mockUseWeb3 = vi.mocked(useWeb3);
const mockUseNetworkStatus = vi.mocked(useNetworkStatus);

// Mock window.alert
const mockAlert = vi.fn();
Object.defineProperty(window, "alert", {
  writable: true,
  value: mockAlert,
});

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({
      networkStatus: "correct",
    });
  });

  it("renders the main layout correctly", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    // Check header elements
    expect(screen.getByText("Ceres Protocol")).toBeInTheDocument();
    expect(screen.getByText("AI驱动的气候预测市场")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-connect")).toBeInTheDocument();

    // Check navigation tabs
    expect(screen.getByText("市场")).toBeInTheDocument();
    expect(screen.getByText("创建")).toBeInTheDocument();
    expect(screen.getByText("统计")).toBeInTheDocument();
    expect(screen.getByText("个人")).toBeInTheDocument();

    // Check footer
    expect(
      screen.getByText("© 2026 Ceres Protocol. AI驱动的气候预测市场平台."),
    ).toBeInTheDocument();
  });

  it("shows market list by default", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    expect(screen.getByTestId("market-list")).toBeInTheDocument();
  });

  it("switches to create tab when clicked", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    const createTab = screen.getByText("创建");
    fireEvent.click(createTab);

    await waitFor(() => {
      expect(screen.getByTestId("judgment-submission")).toBeInTheDocument();
    });
  });

  it("switches to stats tab when clicked", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    const statsTab = screen.getByText("统计");
    fireEvent.click(statsTab);

    await waitFor(() => {
      expect(screen.getByTestId("user-stats")).toBeInTheDocument();
      expect(screen.getByText("No User Stats")).toBeInTheDocument();
    });
  });

  it("shows user stats when connected", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x123",
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    const statsTab = screen.getByText("统计");
    fireEvent.click(statsTab);

    await waitFor(() => {
      expect(screen.getByText("User Stats Loaded")).toBeInTheDocument();
    });
  });

  it("switches to profile tab when clicked", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    const profileTab = screen.getByText("个人");
    fireEvent.click(profileTab);

    await waitFor(() => {
      expect(screen.getByText("个人资料")).toBeInTheDocument();
      expect(screen.getByText("个人资料功能即将推出")).toBeInTheDocument();
    });
  });

  it("handles judgment submission", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x123",
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    // Switch to create tab
    const createTab = screen.getByText("创建");
    fireEvent.click(createTab);

    await waitFor(() => {
      const submitButton = screen.getByText("Submit Judgment");
      fireEvent.click(submitButton);
    });

    expect(mockAlert).toHaveBeenCalledWith("判断事件创建成功！（演示模式）");
  });

  it("handles market trading", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x123",
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    // Market list should be visible by default
    const tradeButton = screen.getByText("Trade Market");
    fireEvent.click(tradeButton);

    expect(mockAlert).toHaveBeenCalledWith(
      "交易成功！买入 YES 1 HSK（演示模式）",
    );
  });

  it("renders responsive layout", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<App />);

    // Check for responsive classes
    const mainContainer = document.querySelector(".max-w-7xl");
    expect(mainContainer).toBeInTheDocument();

    const header = document.querySelector("header");
    expect(header).toHaveClass("bg-white", "border-b", "border-gray-200");
  });
});
