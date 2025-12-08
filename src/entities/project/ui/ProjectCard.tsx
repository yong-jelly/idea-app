import { Link } from "react-router";
import { Heart, MessageCircle, Share2, Bookmark, Star, Users } from "lucide-react";
import { Card, CardContent, CardFooter, Badge, Button, Progress } from "@/shared/ui";
import { cn, formatNumber, formatCurrency } from "@/shared/lib/utils";
import { UserAvatar } from "@/entities/user";
import { CATEGORY_INFO, type Project } from "../model/project.types";

export interface ProjectCardProps {
  project: Project;
  onLike?: (projectId: string) => void;
  onBookmark?: (projectId: string) => void;
  onShare?: (projectId: string) => void;
}

export function ProjectCard({ project, onLike, onBookmark, onShare }: ProjectCardProps) {
  const fundingProgress = Math.round((project.currentFunding / project.targetFunding) * 100);
  const categoryInfo = CATEGORY_INFO[project.category];

  return (
    <Card variant="interactive" className="group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/30 dark:to-indigo-900/30">
            <span className="text-4xl">{categoryInfo.icon}</span>
          </div>
        )}

        {/* Featured Badge */}
        {project.featured && (
          <Badge className="absolute left-3 top-3 bg-gradient-to-r from-primary-500 to-indigo-500 text-white">
            <Star className="mr-1 h-3 w-3" />
            Featured
          </Badge>
        )}

        {/* Days Left */}
        <div className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {project.daysLeft > 0 ? `${project.daysLeft}일 남음` : "마감"}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Category & Tech Stack */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {categoryInfo.icon} {categoryInfo.name}
          </Badge>
          {project.techStack.slice(0, 2).map((tech) => (
            <Badge key={tech} variant="outline">
              {tech}
            </Badge>
          ))}
          {project.techStack.length > 2 && (
            <Badge variant="outline">+{project.techStack.length - 2}</Badge>
          )}
        </div>

        {/* Title & Description */}
        <Link to={`/project/${project.id}`}>
          <h3 className="mb-1 text-lg font-semibold text-slate-900 hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-400 line-clamp-1">
            {project.title}
          </h3>
        </Link>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {project.shortDescription}
        </p>

        {/* Author */}
        <div className="mb-3">
          <UserAvatar
            user={project.author}
            size="sm"
            showName
            className="hover:opacity-80"
          />
        </div>

        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(project.currentFunding)}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              목표: {formatCurrency(project.targetFunding)}
            </span>
          </div>
          <Progress value={fundingProgress} size="md" />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className={cn(fundingProgress >= 100 && "text-green-600 font-medium")}>
              {fundingProgress}% 달성
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatNumber(project.backersCount)}명 후원
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-700">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <button
            onClick={(e) => {
              e.preventDefault();
              onLike?.(project.id);
            }}
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
          >
            <Heart className="h-4 w-4" />
            {formatNumber(project.likesCount)}
          </button>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {formatNumber(project.commentsCount)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              onShare?.(project.id);
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              onBookmark?.(project.id);
            }}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Link to={`/project/${project.id}/support`}>
            <Button size="sm">후원하기</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

