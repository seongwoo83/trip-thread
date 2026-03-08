import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import type { CommentAuthor, CommentWithMeta } from "./types";

export function useComments(postId: string) {
	return useQuery<CommentWithMeta[]>({
		queryKey: ["comments", postId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("comments")
				.select(`*, author:trip_members!comments_author_id_fkey(id, nickname)`)
				.eq("post_id", postId)
				.order("created_at", { ascending: true });

			if (error) throw new Error(error.message);

			const flat = (data ?? []).map((row) => {
				const r = row as typeof row & { author: CommentAuthor };
				return { ...r, author: r.author, replies: [] as CommentWithMeta[] };
			});

			const map = new Map<string, CommentWithMeta>();
			flat.forEach((c) => map.set(c.id, c));

			const roots: CommentWithMeta[] = [];
			map.forEach((c) => {
				if (c.parent_id) {
					map.get(c.parent_id)?.replies.push(c);
				} else {
					roots.push(c);
				}
			});

			return roots;
		},
		enabled: !!postId,
	});
}
