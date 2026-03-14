import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = {
	commentId: string;
	postId: string;
	content: string;
};

export function useEditComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ commentId, postId, content }: Input) => {
			const { error } = await supabase
				.from("comments")
				.update({ content })
				.eq("id", commentId);
			if (error) throw new Error(error.message);

			return postId;
		},
		onSuccess: (postId) => {
			queryClient.invalidateQueries({ queryKey: ["comments", postId] });
		},
	});
}
