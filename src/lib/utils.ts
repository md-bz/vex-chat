import { clsx, type ClassValue } from "clsx";
import { direction } from "direction";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTime(timestamp: number, noTime: boolean = false) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
        // Today - show time only
        if (noTime) return "Today";
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } else if (diffInHours < 48) {
        // Yesterday
        return "Yesterday";
    } else if (diffInHours < 7 * 24) {
        // Within a week - show day name
        return date.toLocaleDateString([], { weekday: "short" });
    } else {
        // Older than a week - show date
        return date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
        });
    }
}

export function cssDirection(text: string) {
    if (direction(text) === "rtl") return "rtl";
    return "ltr";
}

export function formatLastSeen(timestamp: number) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
        // Today - show time only
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } else if (diffInHours < 48) {
        // Yesterday
        return "Yesterday";
    } else if (diffInHours < 7 * 24) {
        // Within a week - show day name
        return date.toLocaleDateString([], { weekday: "short" });
    } else {
        // Older than a week - show date
        return date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
        });
    }
}
