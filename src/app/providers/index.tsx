import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import "dayjs/locale/ko";

const queryClient = new QueryClient();

type ProvidersProps = {
	children: ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
	return (
		<MantineProvider>
			<DatesProvider settings={{ locale: "ko" }}>
				<QueryClientProvider client={queryClient}>
					<BrowserRouter>{children}</BrowserRouter>
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</DatesProvider>
		</MantineProvider>
	);
};
