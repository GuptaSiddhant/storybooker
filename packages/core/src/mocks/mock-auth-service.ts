// oxlint-disable require-await

import {
  StoryBookerPermissionsAllEnabled,
  type AuthAdapter,
  type StoryBookerUser,
} from "../adapters/_internal/auth.ts";

export const mockUser: StoryBookerUser = {
  displayName: "Test User",
  id: "test-user-id",
  imageUrl: "https://example.com/avatar.png",
  title: "Tester",
  permissions: StoryBookerPermissionsAllEnabled,
};

export function mockAuthService(
  permissions: Partial<StoryBookerUser["permissions"]> = {},
): AuthAdapter {
  const user = {
    ...mockUser,
    permissions: {
      ...mockUser.permissions,
      ...permissions,
    },
  };

  return {
    metadata: { name: "MockAuthService", description: "Mock authentication service for testing." },

    init: async (_options): Promise<void> => {
      // Mock init logic if needed
    },
    getUserDetails: async (_options) => {
      // Always return the mock user
      return user;
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
}
