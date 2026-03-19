import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useInfinitePosts, useRealtimePosts } from "@/entities/post";
import { CreatePostForm } from "@/features/create-post";
import { useDeletePost } from "@/features/delete-post";
import { useMemberSession } from "@/shared/store";
import i18n from "@/app/i18n";

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

export const TripBoard = ({ tripId }: Props) => {
	const navigate = useNavigate();
	const { memberId, memberRole } = useMemberSession();
	const { t } = useTranslation();

	useRealtimePosts(tripId);
	const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } =
		useInfinitePosts(tripId);
	const deletePost = useDeletePost();

	const posts = data?.pages.flat() ?? [];

	// 센티널 요소가 뷰포트에 들어오면 다음 페이지 로드
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
					<Loader size="sm" color="indigo" />
				</div>
			) : posts.length > 0 ? (
				<Stack gap="sm">
					{posts.map((post) => {
						const canDelete =
							post.author.id === memberId || memberRole === "host";

						return (
							<div
								key={post.id}
								className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 cursor-pointer"
								onClick={() => navigate(`/trip/${tripId}/post/${post.id}`)}
							>
								{/* 작성자 + 삭제 */}
								<div className="mb-2 flex items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
										{avatarLetter(post.author.nickname)}
									</div>
									<span className="text-sm font-semibold text-gray-800">
										{post.author.nickname}
									</span>
									<span className="ml-auto text-xs text-gray-400">
										{formatRelativeTime(post.created_at)}
									</span>
									{canDelete && (
										<button
											type="button"
											className="text-xs text-gray-400 hover:text-red-500"
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

								{/* 이미지 썸네일 */}
								{post.image_url && (
									<img
										src={post.image_url}
										alt=""
										className="mt-2 h-40 w-full rounded-xl object-cover"
									/>
								)}

								{/* 내용 */}
								{post.content && (
									<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700">
										{post.content}
									</p>
								)}

								{/* 댓글 수 */}
								<div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
									<span>💬</span>
									<span>
										{post.comment_count > 0
											? t("board.commentCount", { count: post.comment_count })
											: t("board.addComment")}
									</span>
								</div>
							</div>
						);
					})}

					{/* 무한 스크롤 센티널 */}
					<div ref={sentinelRef} />

					{isFetchingNextPage && (
						<div className="flex justify-center py-4">
							<Loader size="xs" color="indigo" />
						</div>
					)}

					{!hasNextPage && posts.length > 0 && (
						<Text size="xs" c="gray.4" ta="center" py="sm">
							{t("board.allLoaded")}
						</Text>
					)}
				</Stack>
			) : (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
					<Text size="sm" c="gray.4">
						{t("board.empty")}
					</Text>
					<Text size="xs" c="gray.4" mt={4}>
						{t("board.emptyAction")}
					</Text>
				</div>
			)}
		</Stack>
	);
};
