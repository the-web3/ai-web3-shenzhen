import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JudgmentSubmission } from "../JudgmentSubmission";
import { Web3Provider } from "../../providers/Web3Provider";

// Mock the useWeb3 hook
vi.mock("../../hooks/useWeb3", () => ({
  useWeb3: vi.fn(),
}));

import { useWeb3 } from "../../hooks/useWeb3";
const mockUseWeb3 = vi.mocked(useWeb3);

const renderWithProviders = (component: React.ReactElement) => {
  return render(<Web3Provider>{component}</Web3Provider>);
};

describe("JudgmentSubmission", () => {
  beforeEach(() => {
    // Reset mock before each test
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isCorrectNetwork: true,
      balanceFormatted: "10.5",
      address: "0x1234567890123456789012345678901234567890",
    });
  });
  it("renders correctly", () => {
    renderWithProviders(<JudgmentSubmission />);

    expect(screen.getAllByText("创建判断事件")).toHaveLength(2); // Header and button
    expect(
      screen.getByPlaceholderText(/例如：全球平均温度/),
    ).toBeInTheDocument();
    expect(screen.getByText("市场类型")).toBeInTheDocument();
  });

  it("validates description input", async () => {
    renderWithProviders(<JudgmentSubmission />);

    const submitButton = screen.getByRole("button", { name: /创建判断事件/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("请输入判断描述")).toBeInTheDocument();
    });
  });

  it("validates description length", async () => {
    renderWithProviders(<JudgmentSubmission />);

    const textarea = screen.getByPlaceholderText(/例如：全球平均温度/);
    const longText = "a".repeat(501);

    fireEvent.change(textarea, { target: { value: longText } });

    await waitFor(() => {
      expect(screen.getByText("描述不能超过500个字符")).toBeInTheDocument();
    });
  });

  it("updates price distribution correctly", () => {
    renderWithProviders(<JudgmentSubmission />);

    const yesSlider = screen.getByDisplayValue("0.5");
    fireEvent.change(yesSlider, { target: { value: "0.7" } });

    expect(screen.getByText("70.0%")).toBeInTheDocument();
    expect(screen.getByText("30.0%")).toBeInTheDocument();
  });

  it("validates minimum stake amount", async () => {
    renderWithProviders(<JudgmentSubmission />);

    const stakeInput = screen.getByDisplayValue("0.1");
    fireEvent.change(stakeInput, { target: { value: "0.05" } });

    await waitFor(() => {
      expect(screen.getByText("最低质押金额为 0.1 HSK")).toBeInTheDocument();
    });
  });

  it("validates sufficient balance", async () => {
    // Mock insufficient balance
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isCorrectNetwork: true,
      balanceFormatted: "0.05",
      address: "0x1234567890123456789012345678901234567890",
    });

    renderWithProviders(<JudgmentSubmission />);

    const stakeInput = screen.getByDisplayValue("0.1");
    fireEvent.change(stakeInput, { target: { value: "1" } });

    await waitFor(() => {
      expect(screen.getByText("余额不足")).toBeInTheDocument();
    });
  });

  it("shows market type selection", () => {
    renderWithProviders(<JudgmentSubmission />);

    expect(screen.getByText("AMM 模式")).toBeInTheDocument();
    expect(screen.getByText("订单簿模式")).toBeInTheDocument();
    expect(
      screen.getByText("自动做市商，适合人工判断事件"),
    ).toBeInTheDocument();
  });

  it("switches market type correctly", () => {
    renderWithProviders(<JudgmentSubmission />);

    const orderbookButton = screen.getByText("订单簿模式").closest("button")!;
    fireEvent.click(orderbookButton);

    expect(orderbookButton).toHaveClass("border-primary-500");
  });

  it("calculates expected shares correctly", async () => {
    renderWithProviders(<JudgmentSubmission />);

    // Fill in valid data
    const textarea = screen.getByPlaceholderText(/例如：全球平均温度/);
    fireEvent.change(textarea, { target: { value: "测试判断事件" } });

    const stakeInput = screen.getByDisplayValue("0.1");
    fireEvent.change(stakeInput, { target: { value: "1" } });

    await waitFor(() => {
      expect(screen.getByText("预期份额分配")).toBeInTheDocument();
      expect(screen.getAllByText("2.00")).toHaveLength(2); // YES and NO shares both show 2.00
    });
  });

  it("shows preview modal", async () => {
    renderWithProviders(<JudgmentSubmission />);

    // Fill in valid data
    const textarea = screen.getByPlaceholderText(/例如：全球平均温度/);
    fireEvent.change(textarea, { target: { value: "测试判断事件" } });

    const previewButton = screen.getByText("预览");
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText("判断事件预览")).toBeInTheDocument();
    });
  });

  it("calls onSubmit with correct data", async () => {
    const mockOnSubmit = vi.fn();
    renderWithProviders(<JudgmentSubmission onSubmit={mockOnSubmit} />);

    // Fill in valid data
    const textarea = screen.getByPlaceholderText(/例如：全球平均温度/);
    fireEvent.change(textarea, { target: { value: "测试判断事件" } });

    const submitButton = screen
      .getAllByText("创建判断事件")
      .find((el) => el.tagName === "BUTTON");
    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: "测试判断事件",
        yesPrice: 0.5,
        noPrice: 0.5,
        stakeAmount: 0.1,
        marketType: "AMM",
      });
    });
  });

  it("shows connection warning when not connected", () => {
    // Mock disconnected state
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isCorrectNetwork: false,
      balanceFormatted: "0",
      address: undefined,
    });

    renderWithProviders(<JudgmentSubmission />);

    expect(screen.getByText("请先连接钱包")).toBeInTheDocument();
  });

  it("shows network warning when on wrong network", () => {
    // Mock wrong network
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isCorrectNetwork: false,
      balanceFormatted: "10.5",
      address: "0x1234567890123456789012345678901234567890",
    });

    renderWithProviders(<JudgmentSubmission />);

    expect(
      screen.getByText("请切换到 HashKey Chain 测试网"),
    ).toBeInTheDocument();
  });
});
