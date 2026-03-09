import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = {
	postId: string;
	authorId: string;
	content: string;
	parentId?: string | null;
	depth?: number;
};

export function useCreateComment() {
	const qc = useQueryClient();

	return useMutation<void, Error, Input>({
		mutationFn: async ({
			postId,
			authorId,
			content,
			parentId = null,
			depth = 0,
		}) => {
			const { error } = await supabase.from("comments").insert({
				post_id: postId,
				author_id: authorId,
				content: content.trim(),
				parent_id: parentId,
				depth,
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: (_data, { postId }) => {
			qc.invalidateQueries({ queryKey: ["comments", postId] });
			qc.invalidateQueries({ queryKey: ["post", postId] });
		},
	});
}
