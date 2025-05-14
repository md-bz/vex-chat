import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { formatLastSeen } from "@/lib/utils";

export default ({ user }: { user: User }) => {
    let lastSeen = "Unknown";
    if (user.lastSeen) {
        if (typeof user.lastSeen === "string") {
            lastSeen = user.lastSeen;
        } else {
            lastSeen = formatLastSeen(user.lastSeen);
        }
    }
    return (
        <div className="flex flex-row items-center gap-4">
            <div className="relative">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.imageUrl} alt={user.name} />
                    <AvatarFallback>
                        {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="flex flex-col">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>Last seen {lastSeen}</span>
                </div>
            </div>
        </div>
    );
};
