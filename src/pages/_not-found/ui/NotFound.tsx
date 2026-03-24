import { useNavigate } from "react-router-dom";
import { Button, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

export const NotFoundPage = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<Stack align="center" gap="xs">
				<span
					className="text-7xl font-bold text-indigo-500"
					style={{ fontFamily: "Paperozi", letterSpacing: "-0.04em" }}
				>
					404
				</span>
				<p className="text-base font-semibold text-gray-800 dark:text-gray-100">
					{t("notFound.title")}
				</p>
				<p className="text-sm text-gray-400 dark:text-gray-500">
					{t("notFound.description")}
				</p>
				<Button
					mt="md"
					radius="xl"
					variant="light"
					onClick={() => navigate("/")}
				>
					{t("common.goHome")}
				</Button>
			</Stack>
		</div>
	);
};
