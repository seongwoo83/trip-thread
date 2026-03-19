import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Loader, Stack, Text, Textarea } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { usePost, useRealtimePosts } from "@/entities/post";
import {
	useComments,
	useRealtimeComments,
	type CommentWithMeta,
} from "@/entities/comment";
import { CreateCommentForm } from "@/features/create-comment";
import { useDeletePost } from "@/features/delete-post";
import { useDeleteComment } from "@/features/delete-comment";
import { EditPostForm } from "@/features/edit-post";
import { useEditComment } from "@/features/edit-comment";
import { useMemberSession } from "@/shared/store";
import i18n from "@/app/i18n";

type Props = {
	postId: string;
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

type CommentNodeProps = {
	comment: CommentWithMeta;
	postId: string;
	tripId: string;
	memberId: string;
	memberRole: "host" | "member" | null;
};

const CommentNode = ({
	comment,
	postId,
	tripId,
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
	const { t } = useTranslation();

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
							{t("common.edit")}
						</button>
					)}
					{canDelete && (
						<button
							type="button"
							className="text-xs text-gray-400 hover:text-red-500"
							disabled={deleteComment.isPending}
							onClick={() =>
								deleteComment.mutate({ commentId: comment.id, postId, tripId })
							}
						>
							{t("common.delete")}
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
								{t("common.cancel")}
							</Button>
							<Button
								type="submit"
								size="xs"
								radius="xl"
								loading={editComment.isPending}
								disabled={!editContent.trim()}
							>
								{t("common.save")}
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
						{replying ? t("common.cancel") : t("postThread.reply")}
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
							placeholder={t("postThread.replyPlaceholder")}
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
							tripId={tripId}
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
	const { t } = useTranslation();
	useRealtimePosts(tripId);
	useRealtimeComments(postId, tripId);
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
					{t("postThread.notFound")}
				</Text>
				<button
					type="button"
					className="text-sm text-indigo-500 hover:underline"
					onClick={() => navigate(`/trip/${tripId}`)}
				>
					{t("postThread.backToFeed")}
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
				{t("postThread.backToFeed")}
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
								{t("common.edit")}
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
								{t("common.delete")}
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
					{t("postThread.commentsTitle")}
				</Text>

				<CreateCommentForm
					postId={postId}
					authorId={memberId}
					placeholder={t("postThread.commentPlaceholder")}
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
								tripId={tripId}
								memberId={memberId}
								memberRole={memberRole}
							/>
						))}
					</Stack>
				) : (
					<Text size="sm" c="gray.4" ta="center" py="md">
						{t("postThread.noComments")}
					</Text>
				)}
			</Stack>
		</Stack>
	);
};
