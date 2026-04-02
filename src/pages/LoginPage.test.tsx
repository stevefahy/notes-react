import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoginPage from "./LoginPage";
import type { AuthContextType } from "../types";

function renderLogin() {
  const value: AuthContextType = {
    authContext: {
      loading: false,
      success: null,
      token: null,
      details: null,
      onLogin: vi.fn().mockResolvedValue(undefined),
      onRegister: vi.fn().mockResolvedValue(undefined),
    },
    setAuthContext: vi.fn(),
    verifyRefreshTokenWithRetry: vi.fn().mockResolvedValue(undefined),
  };
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("renders sign-in heading", () => {
    renderLogin();
    expect(screen.getByRole("heading", { level: 2, name: /sign in/i })).toBeInTheDocument();
  });
});
