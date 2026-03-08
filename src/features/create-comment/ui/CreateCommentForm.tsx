import { useState } from "react";
import { Button, Textarea } from "@mantine/core";
import { useCreateComment } from "../model/useCreateComment";

type Props = {
	postId: string;
	authorId: string;
	parentId?: string | null;
	depth?: number;
	placeholder?: string;
	onSuccess?: () => void;
};

export const CreateCommentForm = ({
	postId,
	authorId,
	parentId = null,
	depth = 0,
	placeholder = "댓글을 입력하세요...",
	onSuccess,
}: Props) => {
	const [content, setContent] = useState("");
	const createComment = useCreateComment();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;
		await createComment.mutateAsync({
			postId,
			authorId,
			content,
			parentId,
			depth,
		});
		setContent("");
		onSuccess?.();
	};

	return (
		<form onSubmit={handleSubmit}>
			<div className="flex gap-2">
				<Textarea
					placeholder={placeholder}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					minRows={1}
					autosize
					flex={1}
					styles={{ input: { fontSize: "0.875rem" } }}
				/>
				<Button
					type="submit"
					size="sm"
					radius="xl"
					loading={createComment.isPending}
					disabled={!content.trim()}
					style={{ alignSelf: "flex-end" }}
				>
					등록
				</Button>
			</div>
		</form>
	);
};
