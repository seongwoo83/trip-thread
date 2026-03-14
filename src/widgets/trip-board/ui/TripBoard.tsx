import { useNavigate } from "react-router-dom";
import { Loader, Stack, Text } from "@mantine/core";
import { usePosts } from "@/entities/post";
import { CreatePostForm } from "@/features/create-post";
import { useMemberSession } from "@/shared/store";

type Props = {
	tripId: string;
};

function formatRelativeTime(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "방금";
	if (mins < 60) return `${mins}분 전`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	return `${days}일 전`;
}

function avatarLetter(nickname: string) {
	return nickname.charAt(0).toUpperCase();
}

export const TripBoard = ({ tripId }: Props) => {
	const navigate = useNavigate();
	const { memberId } = useMemberSession();
	const { data: posts, isPending } = usePosts(tripId);

	if (!memberId) return null;

	return (
		<Stack gap="md">
			<CreatePostForm tripId={tripId} authorId={memberId} />

			{isPending ? (
				<div className="flex justify-center py-12">
					<Loader size="sm" color="indigo" />
				</div>
			) : posts && posts.length > 0 ? (
				<Stack gap="sm">
					{posts.map((post) => (
						<button
							key={post.id}
							type="button"
							className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
							onClick={() => navigate(`/trip/${tripId}/post/${post.id}`)}
						>
							{/* 작성자 */}
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
										? `${post.comment_count}개의 댓글`
										: "댓글 달기"}
								</span>
							</div>
						</button>
					))}
				</Stack>
			) : (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
					<Text size="sm" c="gray.4">
						아직 올라온 스레드가 없어요
					</Text>
					<Text size="xs" c="gray.4" mt={4}>
						첫 번째 스레드를 작성해보세요!
					</Text>
				</div>
			)}
		</Stack>
	);
};
