import { User } from "@/lib/types";
import UserInfoPopup from "./UserInfoPopup";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function UserCard({ user }: { user: User }) {
    return (
        <UserInfoPopup user={user}>
            <div className="flex items-center p-2 hover:bg-accent rounded cursor-pointer gap-2">
                <Avatar>
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm truncate">{user.name}</p>
                    {user?.lastSeen && (
                        <p className="text-xs text-muted-foreground">
                            Last seen
                            {new Date(user.lastSeen).toString()}
                        </p>
                    )}
                </div>
            </div>
        </UserInfoPopup>
    );
}
