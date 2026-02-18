import { Routes, Route } from "react-router-dom"; //
import { HomePage } from "@/pages/home";
import { NotFoundPage } from "@/pages/_not-found";
import { TripPage } from "@/pages/trip";

export const AppRouter = () => {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/trip" element={<TripPage />} />
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};
