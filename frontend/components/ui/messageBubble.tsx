"use client";
import { Action, Actions } from "@/components/ui/shadcn-io/ai/actions";
import {
  CheckIcon,
  CopyIcon,
  RefreshCcwIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationSource,
  InlineCitationText,
} from "@/components/ui/shadcn-io/ai/inline-citation";
import { Response } from "@/components/ui/shadcn-io/ai/response";
import { useEffect, useState } from "react";
import { PulseLoader } from "react-spinners";

type Source = {
  title: string;
  url: string;
  description: string;
};

type Props = {
  role: "user" | "assistant" | string;
  content: string;
  createdAt?: string | Date;
  className?: string;
  isLast?: boolean;
  streaming?: boolean;
  metadata?: {
    type?: string;
    sources?: Source[];
    hitCount?: number;
  };
  sending?: boolean;
  onRetry?: (messageContent: string) => void;
};

function fixStreamingMarkdownLists(text: string) {
  return (
    text
      // Join isolated '-' or '*' lines with their following text
      .replace(/(^|\n)([-*])\n(?![-*])/g, "$1$2 ")
      // Ensure list items start on their own line
      .replace(/([^-*])(\s*)([-*]\s+)/g, "$1\n$3")
  );
}

export default function MessageBubble({
  role,
  content,
  metadata,
  createdAt,
  isLast,
  className,
  sending,
  onRetry,
  streaming,
}: Props) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = role === "user";

  const handleRetry = () => {
    if (onRetry && content) {
      onRetry(content);
    }
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.log("Copy error: ", error);
    }
  };

  const actions = [
    {
      icon: RefreshCcwIcon,
      label: "Retry",
      onClick: () => handleRetry(),
    },
    {
      icon: ThumbsUpIcon,
      label: "Like",
      onClick: () => {
        setLiked(!liked);
        setDisliked(false);
      },
    },
    {
      icon: ThumbsDownIcon,
      label: "Dislike",
      onClick: () => {
        setDisliked(!disliked);
        setLiked(false);
      },
    },
    {
      icon: CopyIcon,
      label: "Copy",
      onClick: () => handleCopy(),
    },
  ];

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start flex-col"
      } mb-10 ${className ?? ""}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl leading-relaxed px-4 py-2 whitespace-pre-wrap 
          ${isUser ? "bg-input text-foreground" : "bg-background"}`}
      >
        <Response>{fixStreamingMarkdownLists(content || "")}</Response>
      </div>
      {!isUser && !(isLast && streaming) && (
        <div className="flex items-center">
          <div className="px-1 w-auto relative">
            <div className="flex items-center justify-start gap-1">
              <Actions>
                {actions.map((action) => {
                  const isLike = action.icon === ThumbsUpIcon;
                  const isDislike = action.icon === ThumbsDownIcon;
                  const isCopy = action.icon === CopyIcon;

                  const IconToRender =
                    isCopy && copied ? CheckIcon : action.icon;

                  const isActive = (isLike && liked) || (isDislike && disliked);

                  return (
                    <Action
                      key={action.label}
                      label={action.label}
                      className="!h-auto !min-h-0 !overflow-visible cursor-pointer"
                      onClick={action.onClick}
                    >
                      <IconToRender
                        className="size-4 transition-transform duration-200"
                        style={{
                          transform: isActive ? "scale(1.3)" : "scale(1)",
                          color:
                            isLike && isActive
                              ? "rgb(0,194,0)"
                              : isDislike && isActive
                              ? "rgb(239,68,68)"
                              : "inherit",
                        }}
                      />
                    </Action>
                  );
                })}
              </Actions>
            </div>
          </div>
          <div>
            {metadata?.sources && metadata.sources.length > 0 && (
              <InlineCitation>
                <InlineCitationCard>
                  <InlineCitationCardTrigger
                    sources={metadata.sources.map((src) => src.url)}
                    className="py-1 px-2 dark:bg-neutral-700"
                  />
                  <InlineCitationCardBody className="dark:bg-neutral-700">
                    <InlineCitationCarousel>
                      <InlineCitationCarouselHeader className="h-8 dark:bg-neutral-600">
                        <InlineCitationCarouselPrev className="cursor-pointer" />
                        <InlineCitationCarouselNext className="cursor-pointer" />
                        <InlineCitationCarouselIndex />
                      </InlineCitationCarouselHeader>
                      <InlineCitationCarouselContent className="px-2">
                        {metadata.sources.map((src, idx) => (
                          <InlineCitationCarouselItem key={`${src.url}-${idx}`}>
                            <InlineCitationSource
                              title={src.title}
                              url={src.url}
                              description={src.description}
                            />
                          </InlineCitationCarouselItem>
                        ))}
                      </InlineCitationCarouselContent>
                    </InlineCitationCarousel>
                  </InlineCitationCardBody>
                </InlineCitationCard>
              </InlineCitation>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
