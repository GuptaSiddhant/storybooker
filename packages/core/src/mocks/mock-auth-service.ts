// oxlint-disable require-await
// oxlint-disable sort-keys

import type { AuthAdapter, StoryBookerUser } from "../adapters/auth";

export const mockUser: StoryBookerUser = {
  displayName: "Test User",
  id: "test-user-id",
  imageUrl: "https://example.com/avatar.png",
  title: "Tester",
};

export const mockAuthService: AuthAdapter = {
  metadata: { name: "MockAuthService" },

  init: async (_options) => {
    // Mock init logic if needed
  },
  authorise: async () => {
    // Allow all permissions for testing
    return true;
  },
  getUserDetails: async (_options) => {
    // Always return the mock user
    return mockUser;
  },
  login: async (_options) => {
    // Return a mock Response
    return new Response("Logged in", { status: 200 });
  },
  logout: async (_user, _options) => {
    // Return a mock Response
    return new Response("Logged out", { status: 200 });
  },
  renderAccountDetails: async (_user, _options) => {
    // Return mock HTML
    return "<div>Mock Account Details</div>";
  },
};
