import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletConnect, WalletStatus } from "../WalletConnect";

// Mock the useWeb3 hook
vi.mock("@/hooks/useWeb3", () => ({
  useWeb3: vi.fn(),
  useNetworkStatus: vi.fn(),
}));

import { useWeb3, useNetworkStatus } from "@/hooks/useWeb3";

const mockUseWeb3 = vi.mocked(useWeb3);
const mockUseNetworkStatus = vi.mocked(useNetworkStatus);

describe("WalletConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({
      networkStatus: "correct",
    });
  });

  it("shows connect button when not connected", () => {
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

    render(<WalletConnect />);

    expect(screen.getByText("连接钱包")).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("shows connecting state", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      address: null,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<WalletConnect />);

    expect(screen.getByText("连接中...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows wallet info when connected with correct network", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x1234567890123456789012345678901234567890",
      balanceFormatted: "10.5432",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<WalletConnect />);

    expect(screen.getByText("0x1234...7890")).toBeInTheDocument();
    expect(screen.getByText("10.5432 HSK")).toBeInTheDocument();
  });

  it("shows network warning when on wrong network", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x1234567890123456789012345678901234567890",
      balanceFormatted: "10.5432",
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    mockUseNetworkStatus.mockReturnValue({
      networkStatus: "wrong-network",
    });

    render(<WalletConnect />);

    expect(
      screen.getByText("请切换到 HashKey Chain 测试网"),
    ).toBeInTheDocument();
    expect(screen.getByText("切换网络")).toBeInTheDocument();
  });

  it("calls connect function when connect button is clicked", () => {
    const mockConnect = vi.fn();
    mockUseWeb3.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      balanceFormatted: null,
      isCorrectNetwork: false,
      connect: mockConnect,
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<WalletConnect />);

    const connectButton = screen.getByText("连接钱包");
    fireEvent.click(connectButton);

    expect(mockConnect).toHaveBeenCalledOnce();
  });

  it("opens dropdown when wallet info is clicked", async () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x1234567890123456789012345678901234567890",
      balanceFormatted: "10.5432",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<WalletConnect />);

    const walletButton = screen.getByText("0x1234...7890").closest("button");
    fireEvent.click(walletButton!);

    await waitFor(() => {
      expect(screen.getByText("钱包地址")).toBeInTheDocument();
      expect(
        screen.getByText("0x1234567890123456789012345678901234567890"),
      ).toBeInTheDocument();
    });
  });

  it("calls switchToHashkeyTestnet when switch network button is clicked", async () => {
    const mockSwitchNetwork = vi.fn();
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x1234567890123456789012345678901234567890",
      balanceFormatted: "10.5432",
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: mockSwitchNetwork,
    });

    mockUseNetworkStatus.mockReturnValue({
      networkStatus: "wrong-network",
    });

    render(<WalletConnect />);

    const switchButton = screen.getByText("切换网络");
    fireEvent.click(switchButton);

    expect(mockSwitchNetwork).toHaveBeenCalledOnce();
  });

  it("calls disconnect when disconnect button is clicked", async () => {
    const mockDisconnect = vi.fn();
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x1234567890123456789012345678901234567890",
      balanceFormatted: "10.5432",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: mockDisconnect,
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<WalletConnect />);

    // Open dropdown
    const walletButton = screen.getByText("0x1234...7890").closest("button");
    fireEvent.click(walletButton!);

    await waitFor(() => {
      const disconnectButton = screen.getByText("断开连接");
      fireEvent.click(disconnectButton);
    });

    expect(mockDisconnect).toHaveBeenCalledOnce();
  });
});

describe("WalletStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows not connected status", () => {
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

    render(<WalletStatus />);

    expect(screen.getByText("未连接")).toBeInTheDocument();
  });

  it("shows connected status with correct network", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x1234567890123456789012345678901234567890",
      balanceFormatted: "10.5432",
      isCorrectNetwork: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<WalletStatus />);

    expect(screen.getByText("0x1234...7890")).toBeInTheDocument();
  });

  it("shows connected status with wrong network", () => {
    mockUseWeb3.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x1234567890123456789012345678901234567890",
      balanceFormatted: "10.5432",
      isCorrectNetwork: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchToHashkeyTestnet: vi.fn(),
    });

    render(<WalletStatus />);

    expect(screen.getByText("0x1234...7890")).toBeInTheDocument();
    // Should show warning color indicator
    expect(document.querySelector(".bg-warning-500")).toBeInTheDocument();
  });
});
