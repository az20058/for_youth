import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "ember-dark",
      values: [
        { name: "ember-dark", value: "#1C1C1E" },
        { name: "light", value: "#ffffff" },
      ],
    },

    controls: { matchers: { color: /(background|color)$/i } },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
