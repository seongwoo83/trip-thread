export type Post = {
	id: string;
	trip_id: string;
	author_id: string;
	content: string;
	image_url: string | null;
	created_at: string;
};

export type PostAuthor = {
	id: string;
	nickname: string;
};

export type PostWithMeta = Post & {
	author: PostAuthor;
	comment_count: number;
};
