import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PeriodicTable from "../components/ui/PeriodicTable";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("PeriodicTable", () => {
  it("renders loading state initially", () => {
    renderWithProviders(<PeriodicTable />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
