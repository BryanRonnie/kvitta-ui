import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as authApi from "../src/api/auth.api";
import SignUpPage from "../app/sign-up/page";
import { AuthContext } from "../src/contexts/AuthContext";

/* ------------------ Router Mock ------------------ */

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

/* -------------------------------------------------- */

describe("SignUpPage", () => {
  const setAuthMock = vi.fn();

  const renderWithProvider = () =>
    render(
      <AuthContext.Provider value={{ login: setAuthMock } as any}>
        <SignUpPage />
      </AuthContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error when passwords do not match", () => {
    renderWithProvider();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "12345678" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "different" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    expect(
      screen.getByText("Passwords do not match")
    ).toBeInTheDocument();
  });

  it("submits successfully", async () => {
    vi.spyOn(authApi, "signup").mockResolvedValue({
      access_token: "abc",
      token_type: "bearer",
      user: {
        email: "a@test.com",
        name: "A",
        created_at: new Date().toISOString(),
      },
    } as any);

    renderWithProvider();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "12345678" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "12345678" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(setAuthMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows backend error message", async () => {
    vi.spyOn(authApi, "signup").mockRejectedValue({
      response: {
        data: { detail: "Email already registered" },
      },
    });

    renderWithProvider();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@test.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "12345678" },
    });

    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "12345678" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Email already registered")
      ).toBeInTheDocument();
    });
  });
});