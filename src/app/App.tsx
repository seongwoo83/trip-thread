import { Providers } from "@/app/providers";
import { AppRouter } from "@/app/router";

export const App = () => {
	return (
		<Providers>
			<AppRouter />
		</Providers>
	);
};
