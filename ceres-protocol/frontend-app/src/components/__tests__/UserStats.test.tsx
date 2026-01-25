import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserStats, UserStatsData } from "../UserStats";

// Mock the useWeb3 hook
vi.mock("@/hooks/useWeb3", () => ({
  useWeb3: vi.fn(),
}));

import { useWeb3 } from "@/hooks/useWeb3";

const mockUseWeb3 = vi.mocked(useWeb3);

const mockUserStats: UserStatsData = {
  totalEvents: 5,
  correctPredictions: 3,
  totalStaked: 10.5,
  totalRewards: 2.3,
  greenPointsBalance: 450,
  greenPointsEarned: 500,
  votingPower: 450,
  activePositions: [
    {
      marketId: "1",
      eventId: "0x123",
      description: "Test market 1",
      yesShares: 5.2,
      noShares: 0,
      totalInvested: 2.1,
      totalWithdrawn: 0,
      currentValue: 2.8,
      pnl: 0.7,
      pnlPercentage: 0.33,
      isFinalized: false,
      createdAt: Date.now() / 1000 - 86400 * 2,
    },
  ],
  historicalPositions: [
    {
      marketId: "2",
      eventId: "0x456",
      description: "Test market 2",
      yesShares: 3.0,
      noShares: 0,
      totalInvested: 1.5,
      totalWithdrawn: 2.2,
      currentValue: 2.2,
      pnl: 0.7,
      pnlPercentage: 0.47,
      isFinalized: true,
      outcome: true,
      createdAt: Date.now() / 1000 - 86400 * 7,
      finalizedAt: Date.now() / 1000 - 86400,
    },
  ],
  totalPortfolioValue: 5.0,
  totalPnL: 1.4,
  accuracyRate: 0.6,
  averageStakeSize: 2.1,
  totalTradingVolume: 15.2,
  bestPerformingEvent: "Best event",
  worstPerformingEvent: "Worst event",
};

describe("UserStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows connect wallet message when not connected", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      address: null,
      isConnecting: false,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<UserStats />);

    expect(screen.getByText("连接钱包查看统计")).toBeInTheDocument();
    expect(
      screen.getByText("连接您的钱包以查看个人统计数据和持仓信息"),
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: "0x123",
      isConnecting: false,
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<UserStats isLoading={true} />);

    // Should show loading skeleton
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows no data message when connected but no stats", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: "0x123",
      isConnecting: false,
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<UserStats />);

    expect(screen.getByText("暂无数据")).toBeInTheDocument();
    expect(
      screen.getByText("开始创建或参与预测市场以查看统计数据"),
    ).toBeInTheDocument();
  });

  it("displays user statistics correctly", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: "0x123",
      isConnecting: false,
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<UserStats userStats={mockUserStats} />);

    // Check key metrics - use getAllByText for duplicates
    const accuracyElements = screen.getAllByText("60.0%");
    expect(accuracyElements.length).toBeGreaterThan(0); // Accuracy rate appears in multiple places
    expect(screen.getByText("1.4000 HSK")).toBeInTheDocument(); // Total PnL
    expect(screen.getByText("450")).toBeInTheDocument(); // Green points
    expect(screen.getByText("1")).toBeInTheDocument(); // Active positions count
  });

  it("toggles balance visibility", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: "0x123",
      isConnecting: false,
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<UserStats userStats={mockUserStats} />);

    // Initially balances should be visible
    expect(screen.getByText("1.4000 HSK")).toBeInTheDocument();

    // Click hide balances button
    const hideButton = screen.getByText("隐藏余额");
    fireEvent.click(hideButton);

    // Balances should be hidden
    await waitFor(() => {
      expect(screen.getAllByText("***")).toHaveLength(7); // Correct count for hidden balances
    });

    // Click show balances button
    const showButton = screen.getByText("显示余额");
    fireEvent.click(showButton);

    // Balances should be visible again
    await waitFor(() => {
      expect(screen.getByText("1.4000 HSK")).toBeInTheDocument();
    });
  });

  it("switches between tabs correctly", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: "0x123",
      isConnecting: false,
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<UserStats userStats={mockUserStats} />);

    // Initially on overview tab
    expect(screen.getByText("投资表现")).toBeInTheDocument();

    // Switch to positions tab
    const positionsTab = screen.getByRole("button", { name: /活跃持仓/ });
    fireEvent.click(positionsTab);

    await waitFor(() => {
      expect(screen.getByText("Test market 1")).toBeInTheDocument();
    });

    // Switch to history tab
    const historyTab = screen.getByRole("button", { name: /历史记录/ });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText("Test market 2")).toBeInTheDocument();
      expect(screen.getByText("YES 获胜")).toBeInTheDocument();
    });

    // Switch to rewards tab
    const rewardsTab = screen.getByRole("button", { name: /奖励/ });
    fireEvent.click(rewardsTab);

    await waitFor(() => {
      expect(screen.getAllByText("绿色积分")).toHaveLength(2); // One in stats card, one in rewards tab
      expect(screen.getByText("当前余额")).toBeInTheDocument();
    });
  });

  it("displays position cards with correct information", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: "0x123",
      isConnecting: false,
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<UserStats userStats={mockUserStats} />);

    // Switch to positions tab
    const positionsTab = screen.getByRole("button", { name: /活跃持仓/ });
    fireEvent.click(positionsTab);

    // Check position details
    expect(screen.getByText("Test market 1")).toBeInTheDocument();
    expect(screen.getByText("5.20")).toBeInTheDocument(); // YES shares
    expect(screen.getByText("2.1000 HSK")).toBeInTheDocument(); // Investment
    expect(screen.getByText("+0.7000 HSK")).toBeInTheDocument(); // PnL
  });

  it("shows empty states for tabs with no data", () => {
    const emptyStats: UserStatsData = {
      ...mockUserStats,
      activePositions: [],
      historicalPositions: [],
    };

    mockUseWeb3.mockReturnValue({
      isConnected: true,
      address: "0x123",
      isConnecting: false,
      balanceFormatted: "10.0",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<UserStats userStats={emptyStats} />);

    // Switch to positions tab
    const positionsTab = screen.getByRole("button", { name: /活跃持仓/ });
    fireEvent.click(positionsTab);

    expect(screen.getByText("暂无活跃持仓")).toBeInTheDocument();

    // Switch to history tab
    const historyTab = screen.getByRole("button", { name: /历史记录/ });
    fireEvent.click(historyTab);

    expect(screen.getByText("暂无历史记录")).toBeInTheDocument();
  });
});
