import { useState } from "react";
import { Button, Textarea } from "@mantine/core";
import { useCreatePost } from "../model/useCreatePost";

type Props = {
	tripId: string;
	authorId: string;
};

export const CreatePostForm = ({ tripId, authorId }: Props) => {
	const [content, setContent] = useState("");
	const createPost = useCreatePost();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;
		await createPost.mutateAsync({ tripId, authorId, content });
		setContent("");
	};

	return (
		<form onSubmit={handleSubmit}>
			<div className="rounded-2xl border border-gray-200 bg-white p-4">
				<Textarea
					placeholder="여행에서 있었던 일을 공유해보세요..."
					value={content}
					onChange={(e) => setContent(e.target.value)}
					minRows={3}
					autosize
					styles={{
						input: {
							border: "none",
							padding: 0,
							fontSize: "0.9rem",
							resize: "none",
						},
					}}
				/>
				<div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
					<Button
						type="submit"
						size="sm"
						radius="xl"
						loading={createPost.isPending}
						disabled={!content.trim()}
					>
						올리기
					</Button>
				</div>
			</div>
		</form>
	);
};
