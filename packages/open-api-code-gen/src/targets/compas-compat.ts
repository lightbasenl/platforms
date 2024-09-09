import { GeneratorFile } from "../output/fs.js";
import { descriptionToDocBlock, resolveDefaultOperationId } from "../output/utils.js";
import type { Context } from "../run.js";
import type { GroupedPathItems } from "../utils/openapi.js";
import type { TargetImplementation } from "./interface.js";

export function compasCompat({
	compat: _compas,
}: {
	outputDirectory: string;
	context: Context;
	compat: "web" | "rn";
	pathItems: GroupedPathItems;
}) {
	const typesFile = new GeneratorFile("./common/types.d.ts");
	const apiClient = new GeneratorFile("./common/api-client.tsx");
	const apiClientWrapper = new GeneratorFile("./common/api-client-wrapper.tsx");
	const filesPerGroup: Record<
		string,
		{
			apiClient: GeneratorFile;
			reactQueries: GeneratorFile;
		}
	> = {};

	const filePairForGroup = (group: string) => {
		if (filesPerGroup[group]) {
			return filesPerGroup[group];
		}

		const pair = {
			apiClient: new GeneratorFile(`./${group}/apiClient.ts`),
			reactQueries: new GeneratorFile(`./${group}/reactQueries.tsx`),
		};

		filesPerGroup[group] = pair;
		return pair;
	};

	return {
		init() {
			apiClient.addImport({
				destructureSymbol: "AxiosError",
				package: "axios",
			});
			apiClient.write(`
export type AppErrorResponse = AxiosError<{
  key?: string;
  status?: number;
  requestId?: number;
  info?: {
    [key: string]: unknown;
  };
}>;
`);

			apiClientWrapper.addImport({
				defaultSymbol: "React",
				package: "react",
			});
			apiClientWrapper.addImport({
				destructureSymbol: "AxiosInstance",
				package: "axios",
			});

			apiClientWrapper.addImport({
				destructureSymbol: "PropsWithChildren",
				package: "react",
			});
			apiClientWrapper.addImport({
				destructureSymbol: "createContext",
				package: "react",
			});
			apiClientWrapper.addImport({
				destructureSymbol: "useContext",
				package: "react",
			});

			apiClientWrapper.write(`
const ApiContext = createContext<AxiosInstance | undefined>(undefined);

export function ApiProvider({
  instance,
  children,
}: PropsWithChildren<{
  instance: AxiosInstance;
}>) {
  return <ApiContext.Provider value={instance}>{children}</ApiContext.Provider>;
}

export const useApi = () => {
  const context = useContext(ApiContext);

  if (!context) {
    throw Error("Be sure to wrap your application with <ApiProvider>.");
  }

  return context;
};
`);
		},

		generateForPathItem(group, pathItem) {
			const { apiClient, reactQueries: _reactQueries } = filePairForGroup(group);

			apiClient.addImport({
				destructureSymbol: "AxiosInstance",
				package: "axios",
			});
			apiClient.addImport({
				destructureSymbol: "AxiosRequestConfig",
				package: "axios",
			});
			apiClient.write(descriptionToDocBlock(pathItem.pathItem.description));
			apiClient.write(
				`export async function api${resolveDefaultOperationId(pathItem)}(`,
				() => apiClient.write(")"),
			);
			apiClient.write(`axiosInstance: AxiosInstance,`);
			apiClient.write(`requestConfig?: AxiosRequestConfig,`);
			apiClient.execDefer();

			apiClient.write(`: Promise<void> {`, () => apiClient.write("}\n"));

			apiClient.execDefer();
		},

		filesToWrite() {
			return [typesFile, apiClient, apiClientWrapper].concat(
				Object.values(filesPerGroup).flatMap((it) => [it.apiClient, it.reactQueries]),
			);
		},
	} satisfies TargetImplementation;
}
