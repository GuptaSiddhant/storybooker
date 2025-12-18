import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Button } from "./button";

const meta = {
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const onClick = fn();

export const Default: Story = {
  args: {
    children: "Button",
    onClick,
  },
};

export const InteractionTest: Story = {
  args: {
    children: "Button with test",
    onClick,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button"));
    await expect(onClick).toBeCalled();
  },
};
