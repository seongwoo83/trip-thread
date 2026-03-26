import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useInfinitePosts, useRealtimePosts } from "@/entities/post";
import { CreatePostForm } from "@/features/create-post";
import { useDeletePost } from "@/features/delete-post";
import { useMemberSession } from "@/shared/store";
import i18n from "@/app/i18n";
import styles from "./TripBoard.module.scss";

type Props = {
	tripId: string;
};

function formatRelativeTime(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return i18n.t("board.timeAgo.justNow");
	if (mins < 60) return i18n.t("board.timeAgo.minutes", { count: mins });
	const hours = Math.floor(mins / 60);
	if (hours < 24) return i18n.t("board.timeAgo.hours", { count: hours });
	const days = Math.floor(hours / 24);
	return i18n.t("board.timeAgo.days", { count: days });
}

function avatarLetter(nickname: string) {
	return nickname.charAt(0).toUpperCase();
}

// Deterministic gradient from nickname
function avatarGradient(nickname: string): string {
	const h = nickname.charCodeAt(0) % 5;
	const gradients = [
		"linear-gradient(135deg, #14919b, #38bec9)",
		"linear-gradient(135deg, #0e7c86, #54d1db)",
		"linear-gradient(135deg, #38bec9, #87eaf2)",
		"linear-gradient(135deg, #0a6c74, #2cb1bc)",
		"linear-gradient(135deg, #07585f, #14919b)",
	];
	return gradients[h];
}

export const TripBoard = ({ tripId }: Props) => {
	const navigate = useNavigate();
	const { memberId, memberRole } = useMemberSession();
	const { t } = useTranslation();

	useRealtimePosts(tripId);
	const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } =
		useInfinitePosts(tripId);
	const deletePost = useDeletePost();

	const posts = data?.pages.flat() ?? [];

	const sentinelRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	if (!memberId) return null;

	return (
		<Stack gap="md">
			<CreatePostForm tripId={tripId} authorId={memberId} />

			{isPending ? (
				<div className="flex justify-center py-12">
					<Loader size="sm" color="cyan" />
				</div>
			) : posts.length > 0 ? (
				<Stack gap={10}>
					{posts.map((post, idx) => {
						const canDelete =
							post.author.id === memberId || memberRole === "host";

						return (
							<div
								key={post.id}
								className={`animate-float-in ${styles.postCard}`}
								style={{ animationDelay: `${idx * 40}ms` }}
								onClick={() => navigate(`/trip/${tripId}/post/${post.id}`)}
							>
								<div className={styles.authorRow}>
									<div
										className={styles.avatar}
										style={{ background: avatarGradient(post.author.nickname) }}
									>
										{avatarLetter(post.author.nickname)}
									</div>
									<div className={styles.authorMeta}>
										<span className={styles.authorName}>
											{post.author.nickname}
										</span>
										<span className={styles.time}>
											{formatRelativeTime(post.created_at)}
										</span>
									</div>
									{canDelete && (
										<button
											type="button"
											className={styles.deleteButton}
											disabled={deletePost.isPending}
											onClick={(e) => {
												e.stopPropagation();
												deletePost.mutate({
													postId: post.id,
													tripId,
													imageUrl: post.image_url,
												});
											}}
										>
											{t("common.delete")}
										</button>
									)}
								</div>

								{/* Image */}
								{post.image_url && (
									<img src={post.image_url} alt="" className={styles.image} />
								)}

								{post.content && (
									<p className={`line-clamp-3 ${styles.content}`}>
										{post.content}
									</p>
								)}

								<div className={styles.commentRow}>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
									</svg>
									<span>
										{post.comment_count > 0
											? t("board.commentCount", { count: post.comment_count })
											: t("board.addComment")}
									</span>
								</div>
							</div>
						);
					})}

					<div ref={sentinelRef} />

					{isFetchingNextPage && (
						<div className="flex justify-center py-4">
							<Loader size="xs" color="cyan" />
						</div>
					)}

					{!hasNextPage && posts.length > 0 && (
						<Text size="xs" ta="center" py="sm" className={styles.allLoaded}>
							{t("board.allLoaded")}
						</Text>
					)}
				</Stack>
			) : (
				<div className={styles.emptyState}>
					<Text size="sm" className={styles.emptyTitle}>
						{t("board.empty")}
					</Text>
					<Text size="xs" mt={4} className={styles.emptyHint}>
						{t("board.emptyAction")}
					</Text>
				</div>
			)}
		</Stack>
	);
};
