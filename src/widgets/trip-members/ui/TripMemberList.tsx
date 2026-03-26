import { Loader, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useTripMembers } from "@/entities/trip-member";
import styles from "./TripMemberList.module.scss";

type Props = {
	tripId: string;
	myMemberId: string;
};

function avatarGradient(nickname: string, isHost: boolean): string {
	if (isHost) return "linear-gradient(135deg, #14919b, #0e7c86)";
	const h = nickname.charCodeAt(0) % 4;
	const gradients = [
		"linear-gradient(135deg, #87eaf2, #54d1db)",
		"linear-gradient(135deg, #54d1db, #38bec9)",
		"linear-gradient(135deg, #38bec9, #2cb1bc)",
		"linear-gradient(135deg, #bef8fd, #87eaf2)",
	];
	return gradients[h];
}

export const TripMemberList = ({ tripId, myMemberId }: Props) => {
	const { data: members, isPending } = useTripMembers(tripId);
	const { t } = useTranslation();

	if (isPending) {
		return (
			<div className="flex justify-center py-6">
				<Loader size="xs" color="cyan" />
			</div>
		);
	}

	return (
		<div>
			<Text fw={700} className={styles.count}>
				{t("members.count", { count: members?.length ?? 0 })}
			</Text>
			<div className={styles.list}>
				{members?.map((m) => (
					<div key={m.id} className={styles.item}>
						<div
							className={styles.avatar}
							style={{
								background: avatarGradient(m.nickname, m.role === "host"),
								color: m.role === "host" ? "#fff" : "#0a6c74",
							}}
						>
							{m.nickname.charAt(0).toUpperCase()}
						</div>
						<div className={styles.meta}>
							<span className={styles.name}>{m.nickname}</span>
							{m.id === myMemberId && (
								<span className={styles.me}>{t("members.me")}</span>
							)}
							{m.role === "host" && (
								<span className={styles.hostBadge}>{t("members.host")}</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
