import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import type { Post, PostAuthor } from "./types";

type PostWithAuthor = Post & { author: PostAuthor };

export function usePost(postId: string) {
	return useQuery<PostWithAuthor | null>({
		queryKey: ["post", postId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("posts")
				.select(`*, author:trip_members!posts_author_id_fkey(id, nickname)`)
				.eq("id", postId)
				.maybeSingle();

			if (error) throw new Error(error.message);
			if (!data) return null;

			const r = data as typeof data & {
				author: PostAuthor;
			};
			return { ...r, author: r.author };
		},
		enabled: !!postId,
	});
}
