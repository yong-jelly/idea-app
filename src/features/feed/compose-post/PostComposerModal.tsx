import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui";
import { PostComposer } from "./PostComposer";

interface PostComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 게시하기 모달
 * 
 * 좌측 사이드바나 다른 곳에서 게시하기 버튼을 누르면 팝업으로 표시됩니다.
 */
export function PostComposerModal({ open, onOpenChange }: PostComposerModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] p-0 overflow-hidden">
        <DialogHeader onClose={() => onOpenChange(false)} className="px-4 pt-4 pb-0 mb-0 border-b border-surface-100 dark:border-surface-800">
          <DialogTitle>새 게시물</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <PostComposer variant="modal" onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

