import { Linter } from "eslint";
import markdown from "eslint-plugin-markdown";

/**
 * Allows parsing of markdown files, adding code blocks as virtual files.
 */
export function markdownConfig(): Linter.FlatConfig[] {
  return [
    {
      plugins: {
        markdown,
      },
    },
  ];
}
