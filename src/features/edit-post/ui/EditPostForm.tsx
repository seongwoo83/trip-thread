import { useRef, useState } from "react";
import { Button, Textarea } from "@mantine/core";
import { useEditPost } from "../model/useEditPost";
import styles from "@/features/post-editor/ui/PostEditor.module.scss";

type Props = {
	postId: string;
	tripId: string;
	initialContent: string;
	initialImageUrl?: string | null;
	onCancel: () => void;
	onSuccess: () => void;
};

export const EditPostForm = ({
	postId,
	tripId,
	initialContent,
	initialImageUrl,
	onCancel,
	onSuccess,
}: Props) => {
	const [content, setContent] = useState(initialContent);
	const [newImageFile, setNewImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [currentImageUrl, setCurrentImageUrl] = useState(
		initialImageUrl ?? null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const editPost = useEditPost();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setNewImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		setCurrentImageUrl(null);
	};

	const removeImage = () => {
		setNewImageFile(null);
		setImagePreview(null);
		setCurrentImageUrl(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: { preventDefault(): void }) => {
		e.preventDefault();
		if (!content.trim() && !newImageFile && !currentImageUrl) return;

		await editPost.mutateAsync({
			postId,
			tripId,
			content,
			newImageFile,
			oldImageUrl: initialImageUrl,
			removeImage: !newImageFile && !currentImageUrl && !!initialImageUrl,
		});
		onSuccess();
	};

	const displayImage = imagePreview ?? currentImageUrl;
	const canSubmit = !editPost.isPending && (!!content.trim() || !!displayImage);

	return (
		<form onSubmit={handleSubmit}>
			<Textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				minRows={3}
				autosize
				classNames={{ input: styles.textareaInput }}
			/>

			{displayImage && (
				<div className={styles.previewWrap}>
					<img src={displayImage} alt="" className={styles.previewImage} />
					<button
						type="button"
						onClick={removeImage}
						className={styles.removeImageButton}
					>
						✕
					</button>
				</div>
			)}

			<div className={styles.footer}>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					className={styles.uploadButton}
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<polyline points="21 15 16 10 5 21" />
					</svg>
					사진
				</button>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileChange}
				/>

				<div className={styles.actions}>
					<Button
						type="button"
						variant="subtle"
						size="sm"
						radius="xl"
						color="gray"
						onClick={onCancel}
					>
						취소
					</Button>
					<Button
						type="submit"
						size="sm"
						radius="xl"
						loading={editPost.isPending}
						disabled={!canSubmit}
						className={canSubmit ? styles.submitButton : undefined}
					>
						저장
					</Button>
				</div>
			</div>
		</form>
	);
};
