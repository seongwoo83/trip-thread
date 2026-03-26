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

type CommentNodeProps = {
	comment: CommentWithMeta;
	postId: string;
	tripId: string;
	memberId: string;
	memberRole: "host" | "member" | null;
};

const DEPTH_STYLES = [
	{ ml: 0, bg: "rgba(255,255,255,0.45)", borderLeft: "none" },
	{
		ml: 24,
		bg: "rgba(14,124,134,0.03)",
		borderLeft: "2px solid rgba(14,124,134,0.12)",
	},
	{
		ml: 48,
		bg: "rgba(251,146,60,0.03)",
		borderLeft: "2px solid rgba(251,146,60,0.1)",
	},
];

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

	const depthStyle = DEPTH_STYLES[comment.depth] ?? DEPTH_STYLES[2];

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
				style={{
					marginLeft: depthStyle.ml,
					background: depthStyle.bg,
					borderLeft: depthStyle.borderLeft,
					borderRadius: 12,
					padding: "12px 14px",
				}}
			>
				{/* Author */}
				<div className="mb-1.5 flex items-center gap-2">
					<div
						className="flex items-center justify-center rounded-full text-white shrink-0"
						style={{
							width: 22,
							height: 22,
							background: avatarGradient(comment.author.nickname),
							fontSize: "0.6rem",
							fontWeight: 800,
						}}
					>
						{avatarLetter(comment.author.nickname)}
					</div>
					<span
						style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a3a4a" }}
					>
						{comment.author.nickname}
					</span>
					<span
						style={{
							fontSize: "0.68rem",
							color: "#a8b8c2",
							marginLeft: "auto",
						}}
					>
						{formatRelativeTime(comment.created_at)}
					</span>
					{canEdit && !editing && (
						<button
							type="button"
							style={{
								fontSize: "0.68rem",
								color: "#a8b8c2",
								background: "none",
								border: "none",
								cursor: "pointer",
							}}
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
							style={{
								fontSize: "0.68rem",
								color: "#a8b8c2",
								background: "none",
								border: "none",
								cursor: "pointer",
							}}
							disabled={deleteComment.isPending}
							onClick={() =>
								deleteComment.mutate({ commentId: comment.id, postId, tripId })
							}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = "#ef4444";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = "#a8b8c2";
							}}
						>
							{t("common.delete")}
						</button>
					)}
				</div>

				{/* Content or edit form */}
				{editing ? (
					<form onSubmit={handleEditSubmit} className="mt-1">
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							minRows={1}
							autosize
							styles={{ input: { fontSize: "0.85rem", resize: "none" } }}
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
					<p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "#3d5a66" }}>
						{comment.content}
					</p>
				)}

				{/* Reply button */}
				{canReply && !editing && (
					<button
						type="button"
						style={{
							marginTop: 6,
							fontSize: "0.7rem",
							color: "#a8b8c2",
							fontWeight: 600,
							background: "none",
							border: "none",
							cursor: "pointer",
							transition: "color 0.15s",
						}}
						onClick={() => setReplying((v) => !v)}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = "#14919b";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "#a8b8c2";
						}}
					>
						{replying ? t("common.cancel") : t("postThread.reply")}
					</button>
				)}

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
				<Loader size="sm" color="cyan" />
			</div>
		);
	}

	if (!post) {
		return (
			<Stack align="center" gap="sm" pt={60}>
				<Text size="lg" fw={700} style={{ color: "#3d5a66" }}>
					{t("postThread.notFound")}
				</Text>
				<button
					type="button"
					style={{
						fontSize: "0.85rem",
						color: "#14919b",
						background: "none",
						border: "none",
						cursor: "pointer",
					}}
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
			{/* Back */}
			<button
				type="button"
				className="flex items-center gap-1.5"
				style={{
					fontSize: "0.8rem",
					color: "#8a9ba5",
					fontWeight: 500,
					background: "none",
					border: "none",
					cursor: "pointer",
					transition: "color 0.15s",
				}}
				onClick={() => navigate(`/trip/${tripId}`)}
				onMouseEnter={(e) => {
					e.currentTarget.style.color = "#14919b";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.color = "#8a9ba5";
				}}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
				>
					<polyline points="15 18 9 12 15 6" />
				</svg>
				{t("postThread.backToFeed")}
			</button>

			{/* Post */}
			<div
				style={{
					background: "rgba(255,255,255,0.55)",
					border: "1px solid rgba(14,124,134,0.06)",
					borderRadius: 18,
					padding: "22px 20px",
				}}
			>
				<div className="mb-3.5 flex items-center gap-2.5">
					<div
						className="flex items-center justify-center rounded-full text-white shrink-0"
						style={{
							width: 36,
							height: 36,
							background: avatarGradient(post.author.nickname),
							fontSize: "0.85rem",
							fontWeight: 800,
						}}
					>
						{avatarLetter(post.author.nickname)}
					</div>
					<div>
						<p
							style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1a3a4a" }}
						>
							{post.author.nickname}
						</p>
						<p style={{ fontSize: "0.7rem", color: "#a8b8c2" }}>
							{formatRelativeTime(post.created_at)}
						</p>
					</div>
					<div className="ml-auto flex gap-2">
						{canEditPost && !editingPost && (
							<button
								type="button"
								style={{
									fontSize: "0.72rem",
									color: "#a8b8c2",
									background: "none",
									border: "none",
									cursor: "pointer",
								}}
								onClick={() => setEditingPost(true)}
							>
								{t("common.edit")}
							</button>
						)}
						{canDeletePost && (
							<button
								type="button"
								style={{
									fontSize: "0.72rem",
									color: "#a8b8c2",
									background: "none",
									border: "none",
									cursor: "pointer",
								}}
								disabled={deletePost.isPending}
								onClick={() =>
									deletePost.mutate(
										{ postId: post.id, tripId, imageUrl: post.image_url },
										{ onSuccess: () => navigate(`/trip/${tripId}`) },
									)
								}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = "#ef4444";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = "#a8b8c2";
								}}
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
								className="w-full object-cover"
								style={{ borderRadius: 14, marginBottom: 14 }}
							/>
						)}
						{post.content && (
							<p
								className="whitespace-pre-wrap"
								style={{
									fontSize: "0.9rem",
									lineHeight: 1.7,
									color: "#2d4a56",
								}}
							>
								{post.content}
							</p>
						)}
					</>
				)}
			</div>

			{/* Comments */}
			<Stack gap="sm">
				<Text
					fw={700}
					style={{
						fontSize: "0.78rem",
						color: "#3d5a66",
						letterSpacing: "0.03em",
						textTransform: "uppercase",
					}}
				>
					{t("postThread.commentsTitle")}
				</Text>

				<CreateCommentForm
					postId={postId}
					authorId={memberId}
					placeholder={t("postThread.commentPlaceholder")}
				/>

				{commentsLoading ? (
					<div className="flex justify-center py-6">
						<Loader size="xs" color="cyan" />
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
					<Text size="sm" ta="center" py="md" style={{ color: "#c4d0d6" }}>
						{t("postThread.noComments")}
					</Text>
				)}
			</Stack>
		</Stack>
	);
};
