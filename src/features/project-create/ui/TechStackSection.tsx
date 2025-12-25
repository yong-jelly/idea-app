import { KeyboardEvent, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/shared/ui";

interface TechStackSectionProps {
  techStack: string[];
  onTechStackChange: (techStack: string[]) => void;
}

export function TechStackSection({
  techStack,
  onTechStackChange,
}: TechStackSectionProps) {
  const [techStackInput, setTechStackInput] = useState("");

  const handleTechStackKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && techStackInput.trim()) {
      e.preventDefault();
      const newTag = techStackInput.trim();
      if (!techStack.includes(newTag) && techStack.length < 10) {
        onTechStackChange([...techStack, newTag]);
        setTechStackInput("");
      }
    }
  };

  const removeTechStackTag = (tag: string) => {
    onTechStackChange(techStack.filter((t) => t !== tag));
  };

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="space-y-1 mb-4">
        <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
          기술 스택
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          사용한 기술을 입력하세요 (Enter로 추가, 최대 10개)
        </p>
      </div>

      <div className="space-y-3">
        <Input
          value={techStackInput}
          onChange={(e) => setTechStackInput(e.target.value)}
          onKeyDown={handleTechStackKeyDown}
          placeholder="예: React, TypeScript, Node.js"
          className="h-11 text-base"
        />
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {techStack.map((tag) => (
              <div
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-sm dark:border-surface-700 dark:bg-surface-800"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTechStackTag(tag)}
                  className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-surface-200 dark:hover:bg-surface-700"
                >
                  <X className="h-3 w-3 text-surface-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


