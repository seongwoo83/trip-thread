import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	MantineProvider,
	createTheme,
	localStorageColorSchemeManager,
} from "@mantine/core";

const colorSchemeManager = localStorageColorSchemeManager({
	key: "trip-thread:color-scheme",
});
import { DatesProvider } from "@mantine/dates";
import "dayjs/locale/ko";

const queryClient = new QueryClient();

const theme = createTheme({
	primaryColor: "cyan",
	fontFamily: "Paperozi, system-ui, sans-serif",
	headings: {
		fontFamily: "Paperozi, system-ui, sans-serif",
		fontWeight: "800",
	},
	defaultRadius: "md",
	colors: {
		// Override cyan for our ocean palette
		cyan: [
			"#e0fcff",
			"#bef8fd",
			"#87eaf2",
			"#54d1db",
			"#38bec9",
			"#2cb1bc",
			"#14919b",
			"#0e7c86",
			"#0a6c74",
			"#07585f",
		],
	},
	other: {
		// Semantic colors available via theme.other
		sand: "#faf8f5",
		coral: "#f97316",
		midnight: "#0c1524",
	},
});

type ProvidersProps = {
	children: ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
	return (
		<MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
			<DatesProvider settings={{ locale: "ko" }}>
				<QueryClientProvider client={queryClient}>
					<BrowserRouter>{children}</BrowserRouter>
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</DatesProvider>
		</MantineProvider>
	);
};
