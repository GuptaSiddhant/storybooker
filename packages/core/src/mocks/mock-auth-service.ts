// oxlint-disable require-await
// oxlint-disable sort-keys

import type { AuthService, StoryBookerUser } from "../types/auth.type";

export const mockUser: StoryBookerUser = {
  displayName: "Test User",
  id: "test-user-id",
  imageUrl: "https://example.com/avatar.png",
  title: "Tester",
};

export const mockAuthService: AuthService = {
  init: async (_options) => {
    // Mock init logic if needed
  },
  authorise: async () => {
    // Allow all permissions for testing
    return true;
  },
  getUserDetails: async (_request, _options) => {
    // Always return the mock user
    return mockUser;
  },
  login: async (_request, _options) => {
    // Return a mock Response
    return new Response("Logged in", { status: 200 });
  },
  logout: async (_request, _user, _options) => {
    // Return a mock Response
    return new Response("Logged out", { status: 200 });
  },
  renderAccountDetails: async (_request, _user, _options) => {
    // Return mock HTML
    return "<div>Mock Account Details</div>";
  },
};
