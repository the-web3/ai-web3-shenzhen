import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MarketList, MarketData } from "../MarketList";
import { Web3Provider } from "../../providers/Web3Provider";

// Mock the useWeb3 hook
vi.mock("../../hooks/useWeb3", () => ({
  useWeb3: () => ({
    address: "0x1234567890123456789012345678901234567890",
  }),
}));

const mockMarkets: MarketData[] = [
  {
    id: "1",
    eventId: "0x123",
    description: "全球平均温度是否会在2030年前超过工业化前水平1.5°C？",
    creator: "0x1234567890123456789012345678901234567890",
    marketType: "AMM",
    yesShares: 150,
    noShares: 100,
    totalVolume: 25.5,
    totalLiquidity: 12.3,
    participantCount: 15,
    isFinalized: false,
    createdAt: Date.now() / 1000 - 86400 * 2,
    userPosition: {
      yesShares: 5.2,
      noShares: 0,
      totalInvested: 2.1,
      totalWithdrawn: 0,
    },
  },
  {
    id: "2",
    eventId: "0x456",
    description: "亚太地区可再生能源采用率是否会在2025年达到40%？",
    creator: "0x2345678901234567890123456789012345678901",
    marketType: "ORDERBOOK",
    yesShares: 80,
    noShares: 120,
    totalVolume: 18.2,
    totalLiquidity: 8.7,
    participantCount: 8,
    isFinalized: true,
    outcome: true,
    createdAt: Date.now() / 1000 - 86400 * 7,
    finalizedAt: Date.now() / 1000 - 86400,
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(<Web3Provider>{component}</Web3Provider>);
};

describe("MarketList", () => {
  it("renders market list correctly", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    expect(screen.getByText("预测市场")).toBeInTheDocument();
    expect(screen.getByText("2 个市场")).toBeInTheDocument();
    expect(
      screen.getByText("全球平均温度是否会在2030年前超过工业化前水平1.5°C？"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("亚太地区可再生能源采用率是否会在2025年达到40%？"),
    ).toBeInTheDocument();
  });

  it("shows market types correctly", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    expect(screen.getByText("AMM")).toBeInTheDocument();
    expect(screen.getByText("ORDERBOOK")).toBeInTheDocument();
  });

  it("displays market statistics", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    expect(screen.getByText("25.50 HSK")).toBeInTheDocument(); // Volume (formatted)
    expect(screen.getByText("12.30 HSK")).toBeInTheDocument(); // Liquidity (formatted)
    expect(screen.getByText("15")).toBeInTheDocument(); // Participants
  });

  it("shows finalized market status", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    expect(screen.getByText("YES 获胜")).toBeInTheDocument();
  });

  it("shows user positions", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    expect(screen.getByText("持仓中")).toBeInTheDocument();
    expect(screen.getAllByText("我的持仓")).toHaveLength(2); // One in filter, one in position card
    expect(screen.getByText("5.20")).toBeInTheDocument(); // Just the number part
  });

  it("filters markets by search term", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    const searchInput = screen.getByPlaceholderText("搜索市场...");
    fireEvent.change(searchInput, { target: { value: "温度" } });

    expect(
      screen.getByText("全球平均温度是否会在2030年前超过工业化前水平1.5°C？"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("亚太地区可再生能源采用率是否会在2025年达到40%？"),
    ).not.toBeInTheDocument();
  });

  it("filters markets by status", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    const filterSelect = screen.getByDisplayValue("全部");
    fireEvent.change(filterSelect, { target: { value: "finalized" } });

    expect(
      screen.queryByText("全球平均温度是否会在2030年前超过工业化前水平1.5°C？"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("亚太地区可再生能源采用率是否会在2025年达到40%？"),
    ).toBeInTheDocument();
  });

  it("sorts markets correctly", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    const sortSelect = screen.getByDisplayValue("最新创建");
    fireEvent.change(sortSelect, { target: { value: "volume" } });

    // First market should have higher volume (25.5 vs 18.2)
    const marketCards = screen.getAllByText(/HSK/);
    expect(marketCards[0]).toHaveTextContent("25.5");
  });

  it("shows empty state when no markets", () => {
    renderWithProviders(<MarketList markets={[]} />);

    expect(screen.getByText("没有找到市场")).toBeInTheDocument();
    expect(screen.getByText("还没有创建任何市场")).toBeInTheDocument();
  });

  it("shows empty state when search returns no results", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    const searchInput = screen.getByPlaceholderText("搜索市场...");
    fireEvent.change(searchInput, { target: { value: "不存在的市场" } });

    expect(screen.getByText("没有找到市场")).toBeInTheDocument();
    expect(screen.getByText("尝试调整搜索条件或筛选器")).toBeInTheDocument();
  });

  it("calls onMarketSelect when market is clicked", () => {
    const mockOnMarketSelect = vi.fn();
    renderWithProviders(
      <MarketList markets={mockMarkets} onMarketSelect={mockOnMarketSelect} />,
    );

    // Click on the market description text which should trigger the card click
    const marketDescription = screen.getByText(
      "全球平均温度是否会在2030年前超过工业化前水平1.5°C？",
    );
    fireEvent.click(marketDescription);

    expect(mockOnMarketSelect).toHaveBeenCalledWith(mockMarkets[0]);
  });

  it("shows trade buttons for active markets", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    expect(screen.getByText("买入 YES")).toBeInTheDocument();
    expect(screen.getByText("买入 NO")).toBeInTheDocument();
  });

  it("does not show trade buttons for finalized markets", () => {
    const finalizedMarkets = mockMarkets.filter((m) => m.isFinalized);
    renderWithProviders(<MarketList markets={finalizedMarkets} />);

    expect(screen.queryByText("买入 YES")).not.toBeInTheDocument();
    expect(screen.queryByText("买入 NO")).not.toBeInTheDocument();
  });

  it("calculates prices correctly", () => {
    renderWithProviders(<MarketList markets={mockMarkets} />);

    // First market: 150 YES, 100 NO shares
    // YES price = 150 / (150 + 100) = 0.6 = 60%
    // NO price = 100 / (150 + 100) = 0.4 = 40%
    const yesElements = screen.getAllByText("60.0%");
    const noElements = screen.getAllByText("40.0%");

    expect(yesElements.length).toBeGreaterThan(0);
    expect(noElements.length).toBeGreaterThan(0);
  });
});
