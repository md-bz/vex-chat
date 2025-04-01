import { HashIcon, MessageCircleIcon, UsersIcon } from "lucide-react";

export const ChannelIcon = ({
    type,
}: {
    type: "channel" | "group" | "private";
}) => {
    switch (type) {
        case "channel":
            return <HashIcon className="h-5 w-5" />;
        case "group":
            return <UsersIcon className="h-5 w-5" />;
        case "private":
            return <MessageCircleIcon className="h-5 w-5" />;
        default:
            return null;
    }
};
