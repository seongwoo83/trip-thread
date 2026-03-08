export type Comment = {
	id: string;
	post_id: string;
	parent_id: string | null;
	author_id: string;
	content: string;
	depth: number;
	created_at: string;
};

export type CommentAuthor = {
	id: string;
	nickname: string;
};

export type CommentWithMeta = Comment & {
	author: CommentAuthor;
	replies: CommentWithMeta[];
};
