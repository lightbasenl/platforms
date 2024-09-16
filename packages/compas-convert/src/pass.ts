import type { SourceFile } from "ts-morph";
import type { Context } from "./context.js";

export type GlobalPass = (context: Context) => void | Promise<void>;
export type FilePass = (context: Context, file: SourceFile) => void | Promise<void>;
export type Pass = GlobalPass | FilePass;
