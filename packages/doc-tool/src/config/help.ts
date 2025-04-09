import consola from "consola";
import { colorize } from "consola/utils";

export function printHelp({ configurationFile }: { configurationFile: string }) {
	const align = 20;
	consola.log(`
Usage: ${colorize("cyan", `node ${configurationFile} [...options]`)}

A CLI tool for maintaining and improving Markdown-based project and process documentation
with support for TOC generation, link checking, glossary suggestions, and more.

Commands:
  ${colorize("cyan", `node ${configurationFile}`)}
    Run basic checks on all files in the configured content roots.

  ${colorize("cyan", `node ${configurationFile} suggest [glob]`)}
    Suggest changes to files based on the configured content roots.
    Pass in a glob to only suggest changes to the full contents of files matching the glob.

Flags:
  ${"--help".padEnd(align, " ")} Prints this help output.
  ${"--github-token".padEnd(align, " ")} Integrate with GitHub to create comments on PRs.

Check the docs for more information at https://github.com/lightbasenl/platforms/tree/main/packages/doc-tool
		`);
}
