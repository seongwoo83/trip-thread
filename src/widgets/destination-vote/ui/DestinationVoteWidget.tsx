import { useState } from "react";
import { Button, Progress, Stack, Text, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useDestinationProposals } from "@/entities/destination-proposal";
import { useProposeDestination } from "@/features/propose-destination";
import { useVoteDestination } from "@/features/vote-destination";
import { useConfirmDestination } from "@/features/confirm-destination";
import styles from "./DestinationVoteWidget.module.scss";

type Props = {
	tripId: string;
	memberId: string;
	role: "host" | "member";
};

export const DestinationVoteWidget = ({ tripId, memberId, role }: Props) => {
	const [proposeInput, setProposeInput] = useState("");
	const [showProposeForm, setShowProposeForm] = useState(false);
	const { t } = useTranslation();

	const { proposals, totalVotes, myVotedProposalId } = useDestinationProposals(
		tripId,
		memberId,
	);

	const propose = useProposeDestination();
	const vote = useVoteDestination();
	const confirm = useConfirmDestination();

	const handlePropose = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!proposeInput.trim()) return;
		await propose.mutateAsync({ tripId, memberId, name: proposeInput });
		setProposeInput("");
		setShowProposeForm(false);
	};

	const handleVote = (proposalId: string) => {
		vote.mutate({ tripId, memberId, proposalId });
	};

	const handleConfirm = () => {
		confirm.mutate({ tripId });
	};

	return (
		<Stack gap="xl">
			<div>
				<h2 className={styles.title}>{t("destinationVote.title")}</h2>
				<Text size="sm" mt={6} className={styles.subtitle}>
					{t("destinationVote.subtitle")}
				</Text>
			</div>

			{proposals.length === 0 ? (
				<div className={styles.emptyState}>
					<Text size="sm" className={styles.emptyText}>
						{t("destinationVote.noProposals")}
					</Text>
					<Text size="xs" mt={4} className={styles.emptyHint}>
						{t("destinationVote.proposeFirst")}
					</Text>
				</div>
			) : (
				<Stack gap={10}>
					{proposals.map((p, idx) => {
						const pct = totalVotes > 0 ? (p.voteCount / totalVotes) * 100 : 0;
						const isMyVote = p.hasMyVote;
						const canVote = !myVotedProposalId;

						return (
							<div
								key={p.id}
								className={`animate-float-in ${styles.proposalCard}`}
								style={{ animationDelay: `${idx * 50}ms` }}
								data-voted={isMyVote}
							>
								<div className={styles.proposalRow}>
									<div className={styles.proposalHeading}>
										{isMyVote && (
											<span className={styles.voteBadge}>
												{t("destinationVote.myVote")}
											</span>
										)}
										<Text fw={700} size="sm" className={styles.proposalName}>
											{p.name}
										</Text>
									</div>
									<div className={styles.proposalMeta}>
										<Text size="xs" className={styles.voteCount}>
											{p.voteCount}
											{t("destinationVote.votes")}
											{totalVotes > 0 && ` (${Math.round(pct)}%)`}
										</Text>
										{canVote && (
											<Button
												size="xs"
												variant="light"
												radius="xl"
												loading={
													vote.isPending && vote.variables?.proposalId === p.id
												}
												onClick={() => handleVote(p.id)}
											>
												{t("destinationVote.vote")}
											</Button>
										)}
									</div>
								</div>
								<Progress
									value={pct}
									size="xs"
									radius="xl"
									color={isMyVote ? "cyan" : "gray"}
								/>
							</div>
						);
					})}
				</Stack>
			)}

			{totalVotes > 0 && (
				<Text size="xs" ta="center" className={styles.totalVotes}>
					{t("destinationVote.totalVotes", { count: totalVotes })}
				</Text>
			)}

			{showProposeForm ? (
				<form onSubmit={handlePropose}>
					<Stack gap="xs">
						<TextInput
							placeholder={t("destinationVote.proposePlaceholder")}
							value={proposeInput}
							onChange={(e) => setProposeInput(e.target.value)}
							autoFocus
						/>
						<div className={styles.formActions}>
							<Button
								type="submit"
								size="sm"
								loading={propose.isPending}
								disabled={!proposeInput.trim()}
								flex={1}
							>
								{t("destinationVote.proposeSubmit")}
							</Button>
							<Button
								size="sm"
								variant="subtle"
								color="gray"
								onClick={() => {
									setShowProposeForm(false);
									setProposeInput("");
								}}
							>
								{t("common.cancel")}
							</Button>
						</div>
					</Stack>
				</form>
			) : (
				<Button
					variant="light"
					radius="xl"
					onClick={() => setShowProposeForm(true)}
				>
					{t("destinationVote.propose")}
				</Button>
			)}

			{role === "host" && proposals.length > 0 && (
				<div className={styles.hostDivider}>
					<Text size="xs" mb="xs" ta="center" className={styles.hostHint}>
						{t("destinationVote.hostConfirmHint")}
					</Text>
					<Button
						fullWidth
						variant="outline"
						color="gray"
						radius="xl"
						size="sm"
						loading={confirm.isPending}
						onClick={handleConfirm}
					>
						{t("destinationVote.hostConfirm")}
					</Button>
				</div>
			)}
		</Stack>
	);
};
