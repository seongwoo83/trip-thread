import { Routes, Route, Outlet } from "react-router-dom";
import { AppShell, Container } from "@mantine/core";
import { HomePage } from "@/pages/home";
import { NotFoundPage } from "@/pages/_not-found";
import { TripPage } from "@/pages/trip";
import { Header } from "@/widgets/header";

const Layout = () => (
	<AppShell header={{ height: 56 }}>
		<AppShell.Header>
			<Header />
		</AppShell.Header>
		<AppShell.Main>
			<Container size="xl">
				<Outlet />
			</Container>
		</AppShell.Main>
	</AppShell>
);

export const AppRouter = () => {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<HomePage />} />
				<Route path="/trip" element={<TripPage />} />
				<Route path="*" element={<NotFoundPage />} />
			</Route>
		</Routes>
	);
};
