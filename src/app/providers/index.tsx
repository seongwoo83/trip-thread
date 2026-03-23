import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MantineProvider, localStorageColorSchemeManager } from "@mantine/core";

const colorSchemeManager = localStorageColorSchemeManager({
	key: "trip-thread:color-scheme",
});
import { DatesProvider } from "@mantine/dates";
import "dayjs/locale/ko";

const queryClient = new QueryClient();

type ProvidersProps = {
	children: ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
	return (
		<MantineProvider colorSchemeManager={colorSchemeManager}>
			<DatesProvider settings={{ locale: "ko" }}>
				<QueryClientProvider client={queryClient}>
					<BrowserRouter>{children}</BrowserRouter>
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</DatesProvider>
		</MantineProvider>
	);
};
