import { useState } from "react";
import { Button, Progress, Stack, Text, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useDestinationProposals } from "@/entities/destination-proposal";
import { useProposeDestination } from "@/features/propose-destination";
import { useVoteDestination } from "@/features/vote-destination";
import { useConfirmDestination } from "@/features/confirm-destination";

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
			{/* 헤더 */}
			<div>
				<h2
					className="text-xl font-bold text-gray-900 dark:text-gray-100"
					style={{ fontFamily: "Paperozi" }}
				>
					{t("destinationVote.title")}
				</h2>
				<Text size="sm" c="gray.5" mt={4}>
					{t("destinationVote.subtitle")}
				</Text>
			</div>

			{/* 제안 목록 */}
			{proposals.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 py-12 text-center">
					<Text size="sm" c="gray.4">
						{t("destinationVote.noProposals")}
					</Text>
					<Text size="xs" c="gray.4" mt={4}>
						{t("destinationVote.proposeFirst")}
					</Text>
				</div>
			) : (
				<Stack gap="sm">
					{proposals.map((p) => {
						const pct = totalVotes > 0 ? (p.voteCount / totalVotes) * 100 : 0;
						const isMyVote = p.hasMyVote;
						const canVote = !myVotedProposalId;

						return (
							<div
								key={p.id}
								className={`rounded-2xl border p-4 transition-all ${
									isMyVote
										? "border-indigo-300 bg-indigo-50/60 dark:bg-indigo-900/30"
										: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
								}`}
							>
								<div className="mb-2 flex items-center justify-between">
									<div className="flex items-center gap-2">
										{isMyVote && (
											<span className="text-xs font-medium text-indigo-500">
												{t("destinationVote.myVote")}
											</span>
										)}
										<Text fw={600} size="sm">
											{p.name}
										</Text>
									</div>
									<div className="flex items-center gap-2">
										<Text size="xs" c="gray.5">
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
									color={isMyVote ? "indigo" : "gray"}
								/>
							</div>
						);
					})}
				</Stack>
			)}

			{/* 투표 현황 요약 */}
			{totalVotes > 0 && (
				<Text size="xs" c="gray.4" ta="center">
					{t("destinationVote.totalVotes", { count: totalVotes })}
				</Text>
			)}

			{/* 여행지 제안 폼 */}
			{showProposeForm ? (
				<form onSubmit={handlePropose}>
					<Stack gap="xs">
						<TextInput
							placeholder={t("destinationVote.proposePlaceholder")}
							value={proposeInput}
							onChange={(e) => setProposeInput(e.target.value)}
							autoFocus
						/>
						<div className="flex gap-2">
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

			{/* 호스트 전용: 투표 마감 */}
			{role === "host" && proposals.length > 0 && (
				<div className="border-t border-gray-100 dark:border-gray-700 pt-4">
					<Text size="xs" c="gray.4" mb="xs" ta="center">
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
