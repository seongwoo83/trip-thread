import { useParams, useNavigate } from "react-router-dom";
import { Button, Loader, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useTripAccess } from "@/entities/trip";
import { PostThread } from "@/widgets/post-thread";
import styles from "./Post.module.scss";

export const PostPage = () => {
	const { id, postId } = useParams<{ id: string; postId: string }>();
	const navigate = useNavigate();
	const { status, trip } = useTripAccess(id);
	const { t } = useTranslation();

	if (status === "loading") {
		return (
			<div className="flex items-center justify-center py-32">
				<Loader size="sm" color="cyan" />
			</div>
		);
	}

	if (status === "not-found") {
		return (
			<Stack align="center" gap="sm" pt={60}>
				<Text size="lg" fw={700} className={styles.stateTitle}>
					{t("trip.notFound.title")}
				</Text>
				<Button
					variant="subtle"
					size="sm"
					mt="xs"
					color="cyan"
					onClick={() => navigate("/")}
				>
					{t("common.goHome")}
				</Button>
			</Stack>
		);
	}

	if (status === "unauthorized") {
		return (
			<Stack align="center" gap="sm" pt={60}>
				<Text size="lg" fw={700} className={styles.stateTitle}>
					{t("trip.unauthorized.title")}
				</Text>
				<Button
					variant="subtle"
					size="sm"
					mt="xs"
					color="cyan"
					onClick={() => navigate("/")}
				>
					{t("common.goHome")}
				</Button>
			</Stack>
		);
	}

	return (
		<div className={`animate-float-in ${styles.page}`}>
			<div>
				<p className={styles.meta}>
					{trip!.start_date} — {trip!.end_date}
				</p>
				<h1 className={styles.title}>{trip!.name}</h1>
				{trip!.destination && (
					<div className={styles.destinationBadge}>
						<span className={styles.destinationText}>
							📍 {trip!.destination}
						</span>
					</div>
				)}
			</div>

			<PostThread postId={postId!} tripId={trip!.id} />
		</div>
	);
};
