import { useNavigate } from "react-router-dom";
import { Button, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import styles from "./NotFound.module.scss";

export const NotFoundPage = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className={styles.page}>
			<Stack align="center" gap="xs">
				<span className={styles.code}>404</span>
				<p className={styles.title}>{t("notFound.title")}</p>
				<p className={styles.description}>{t("notFound.description")}</p>
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
