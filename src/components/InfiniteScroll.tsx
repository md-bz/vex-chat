import React, { useRef, useEffect, useCallback } from "react";
import { Spinner } from "./ui/loading";
import { LoadStatus } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface InfiniteScrollAreaProps {
    direction?: "top" | "bottom";
    loadMore: () => void;
    loadStatus: LoadStatus;
    children: React.ReactNode;
    scrollTrigger?: any;
    className?: string;
}

export const InfiniteScrollArea = ({
    direction = "top",
    loadMore,
    loadStatus,
    children,
    scrollTrigger,
    className = "",
}: InfiniteScrollAreaProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevLoadingRef = useRef<LoadStatus>(null);

    const handleScroll = useCallback(
        (event: React.UIEvent<HTMLDivElement>) => {
            if (loadStatus !== "CanLoadMore") return;
            const scrollTop = event.currentTarget.scrollTop;
            const scrollHeight = event.currentTarget.scrollHeight;
            const clientHeight = event.currentTarget.clientHeight;

            if (direction === "top" && scrollTop < 50) {
                // Load more when near the top
                loadMore();
            } else if (
                direction === "bottom" &&
                scrollHeight - (scrollTop + clientHeight) < 50
            ) {
                // Load more when near the bottom
                loadMore();
            }
        },
        [loadStatus, direction]
    );

    // Scroll to appropriate position when loading state changes
    useEffect(() => {
        if (
            !scrollRef ||
            !scrollRef.current ||
            prevLoadingRef.current === "LoadingMore"
        ) {
            prevLoadingRef.current = loadStatus;
            return;
        }

        // For top-loading, scroll to bottom to maintain position
        if (direction === "top") {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        prevLoadingRef.current = loadStatus;
    }, [direction, scrollTrigger]);

    return (
        <ScrollArea
            className={`flex flex-col ${className}`}
            ref={scrollRef}
            onScroll={handleScroll}
        >
            {direction === "top" && loadStatus === "LoadingMore" && (
                <div className="flex justify-center py-2">
                    <Spinner size="small" />
                </div>
            )}
            {children}
            {direction === "bottom" && loadStatus === "LoadingMore" && (
                <div className="flex justify-center py-2">
                    <Spinner size="small" />
                </div>
            )}
        </ScrollArea>
    );
};
