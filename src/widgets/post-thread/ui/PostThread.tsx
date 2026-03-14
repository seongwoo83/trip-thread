import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Loader, Stack, Text, Textarea } from "@mantine/core";
import { usePost } from "@/entities/post";
import { useComments, type CommentWithMeta } from "@/entities/comment";
import { CreateCommentForm } from "@/features/create-comment";
import { useDeletePost } from "@/features/delete-post";
import { useDeleteComment } from "@/features/delete-comment";
import { EditPostForm } from "@/features/edit-post";
import { useEditComment } from "@/features/edit-comment";
import { useMemberSession } from "@/shared/store";

type Props = {
	postId: string;
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

type CommentNodeProps = {
	comment: CommentWithMeta;
	postId: string;
	memberId: string;
	memberRole: "host" | "member" | null;
};

const CommentNode = ({
	comment,
	postId,
	memberId,
	memberRole,
}: CommentNodeProps) => {
	const [replying, setReplying] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editContent, setEditContent] = useState(comment.content);
	const canReply = comment.depth < 2;
	const canDelete = comment.author.id === memberId || memberRole === "host";
	const canEdit = comment.author.id === memberId;
	const deleteComment = useDeleteComment();
	const editComment = useEditComment();

	const handleEditSubmit = async (e: { preventDefault(): void }) => {
		e.preventDefault();
		if (!editContent.trim()) return;
		await editComment.mutateAsync({
			commentId: comment.id,
			postId,
			content: editContent,
		});
		setEditing(false);
	};

	return (
		<div>
			<div
				className={`rounded-xl p-3 ${
					comment.depth === 0
						? "bg-white"
						: comment.depth === 1
							? "ml-6 bg-gray-50"
							: "ml-12 bg-gray-100"
				}`}
			>
				{/* 작성자 */}
				<div className="mb-1.5 flex items-center gap-2">
					<div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
						{avatarLetter(comment.author.nickname)}
					</div>
					<span className="text-xs font-semibold text-gray-700">
						{comment.author.nickname}
					</span>
					<span className="ml-auto text-xs text-gray-400">
						{formatRelativeTime(comment.created_at)}
					</span>
					{canEdit && !editing && (
						<button
							type="button"
							className="text-xs text-gray-400 hover:text-indigo-500"
							onClick={() => {
								setEditContent(comment.content);
								setEditing(true);
							}}
						>
							수정
						</button>
					)}
					{canDelete && (
						<button
							type="button"
							className="text-xs text-gray-400 hover:text-red-500"
							disabled={deleteComment.isPending}
							onClick={() =>
								deleteComment.mutate({ commentId: comment.id, postId })
							}
						>
							삭제
						</button>
					)}
				</div>

				{/* 내용 or 수정 폼 */}
				{editing ? (
					<form onSubmit={handleEditSubmit} className="mt-1">
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							minRows={1}
							autosize
							styles={{ input: { fontSize: "0.875rem", resize: "none" } }}
						/>
						<div className="mt-2 flex gap-2">
							<Button
								type="button"
								variant="subtle"
								size="xs"
								radius="xl"
								color="gray"
								onClick={() => setEditing(false)}
							>
								취소
							</Button>
							<Button
								type="submit"
								size="xs"
								radius="xl"
								loading={editComment.isPending}
								disabled={!editContent.trim()}
							>
								저장
							</Button>
						</div>
					</form>
				) : (
					<p className="text-sm leading-relaxed text-gray-700">
						{comment.content}
					</p>
				)}

				{/* 답글 버튼 */}
				{canReply && !editing && (
					<button
						type="button"
						className="mt-1.5 text-xs text-gray-400 hover:text-indigo-500"
						onClick={() => setReplying((v) => !v)}
					>
						{replying ? "취소" : "답글"}
					</button>
				)}

				{/* 답글 폼 */}
				{replying && (
					<div className="mt-2">
						<CreateCommentForm
							postId={postId}
							authorId={memberId}
							parentId={comment.id}
							depth={comment.depth + 1}
							placeholder="답글을 입력하세요..."
							onSuccess={() => setReplying(false)}
						/>
					</div>
				)}
			</div>

			{/* 대댓글 */}
			{comment.replies.length > 0 && (
				<Stack gap={4} mt={4}>
					{comment.replies.map((reply) => (
						<CommentNode
							key={reply.id}
							comment={reply}
							postId={postId}
							memberId={memberId}
							memberRole={memberRole}
						/>
					))}
				</Stack>
			)}
		</div>
	);
};

export const PostThread = ({ postId, tripId }: Props) => {
	const navigate = useNavigate();
	const { memberId, memberRole } = useMemberSession();
	const { data: post, isPending: postLoading } = usePost(postId);
	const { data: comments, isPending: commentsLoading } = useComments(postId);
	const deletePost = useDeletePost();
	const [editingPost, setEditingPost] = useState(false);

	if (!memberId) return null;

	if (postLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader size="sm" color="indigo" />
			</div>
		);
	}

	if (!post) {
		return (
			<Stack align="center" gap="sm" pt={60}>
				<Text size="lg" fw={600} c="gray.7">
					스레드를 찾을 수 없어요
				</Text>
				<button
					type="button"
					className="text-sm text-indigo-500 hover:underline"
					onClick={() => navigate(`/trip/${tripId}`)}
				>
					← 피드로 돌아가기
				</button>
			</Stack>
		);
	}

	const canEditPost = post.author.id === memberId;
	const canDeletePost = post.author.id === memberId || memberRole === "host";

	return (
		<Stack gap="xl">
			{/* 뒤로가기 */}
			<button
				type="button"
				className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-500"
				onClick={() => navigate(`/trip/${tripId}`)}
			>
				← 피드로 돌아가기
			</button>

			{/* 원본 포스트 */}
			<div className="rounded-2xl border border-gray-200 bg-white p-5">
				<div className="mb-3 flex items-center gap-2">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
						{avatarLetter(post.author.nickname)}
					</div>
					<div>
						<p className="text-sm font-semibold text-gray-800">
							{post.author.nickname}
						</p>
						<p className="text-xs text-gray-400">
							{formatRelativeTime(post.created_at)}
						</p>
					</div>
					<div className="ml-auto flex gap-2">
						{canEditPost && !editingPost && (
							<button
								type="button"
								className="text-xs text-gray-400 hover:text-indigo-500"
								onClick={() => setEditingPost(true)}
							>
								수정
							</button>
						)}
						{canDeletePost && (
							<button
								type="button"
								className="text-xs text-gray-400 hover:text-red-500"
								disabled={deletePost.isPending}
								onClick={() =>
									deletePost.mutate(
										{ postId: post.id, tripId, imageUrl: post.image_url },
										{ onSuccess: () => navigate(`/trip/${tripId}`) },
									)
								}
							>
								삭제
							</button>
						)}
					</div>
				</div>

				{editingPost ? (
					<EditPostForm
						postId={post.id}
						tripId={tripId}
						initialContent={post.content ?? ""}
						initialImageUrl={post.image_url}
						onCancel={() => setEditingPost(false)}
						onSuccess={() => setEditingPost(false)}
					/>
				) : (
					<>
						{post.image_url && (
							<img
								src={post.image_url}
								alt=""
								className="mb-3 w-full rounded-xl object-cover"
							/>
						)}
						{post.content && (
							<p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
								{post.content}
							</p>
						)}
					</>
				)}
			</div>

			{/* 댓글 섹션 */}
			<Stack gap="sm">
				<Text size="sm" fw={600} c="gray.7">
					댓글
				</Text>

				<CreateCommentForm
					postId={postId}
					authorId={memberId}
					placeholder="댓글을 남겨보세요..."
				/>

				{commentsLoading ? (
					<div className="flex justify-center py-6">
						<Loader size="xs" color="indigo" />
					</div>
				) : comments && comments.length > 0 ? (
					<Stack gap="xs">
						{comments.map((comment) => (
							<CommentNode
								key={comment.id}
								comment={comment}
								postId={postId}
								memberId={memberId}
								memberRole={memberRole}
							/>
						))}
					</Stack>
				) : (
					<Text size="sm" c="gray.4" ta="center" py="md">
						아직 댓글이 없어요. 첫 댓글을 남겨보세요!
					</Text>
				)}
			</Stack>
		</Stack>
	);
};
