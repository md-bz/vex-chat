import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { useChatStore } from "@/lib/store";
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Id } from "../../convex/_generated/dataModel";
import { DialogContent } from "@radix-ui/react-dialog";
import { User } from "@/lib/types";

interface ChatListProps {
    type: "channel" | "group" | "private";
    items: Array<{
        _id: Id<"channels">;
        name: string;
        user?: User | null;
    } | null>;
    icon: React.ElementType;
    onCreateItem: (name: string) => Promise<void>;
}

export const ChatList: React.FC<ChatListProps> = ({
    type,
    items,
    icon: Icon,
    onCreateItem,
}) => {
    const { currentChannel, selectChannel } = useChatStore();
    const [newItemName, setNewItemName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCreate = async () => {
        if (newItemName.trim()) {
            await onCreateItem(newItemName.trim());
            setNewItemName("");
            setIsDialogOpen(false);
        }
    };

    const getDialogTitle = () => {
        switch (type) {
            case "channel":
                return "Create a new channel";
            case "group":
                return "Create a new group";
            case "private":
                return "Start a new conversation";
        }
    };

    const getPlaceholder = () => {
        switch (type) {
            case "channel":
                return "Channel name";
            case "group":
                return "Group name";
            case "private":
                return "User Id";
        }
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                    {type === "channel"
                        ? "Channels"
                        : type === "group"
                          ? "Groups"
                          : "Direct Messages"}
                </h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-sm"
                        >
                            <PlusIcon className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{getDialogTitle()}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <Input
                                placeholder={getPlaceholder()}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                            />
                            <Button onClick={handleCreate}>
                                {type === "channel"
                                    ? "Create Channel"
                                    : type === "group"
                                      ? "Create Group"
                                      : "Start Conversation"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="space-y-1">
                {items?.map((item) => {
                    if (!item) return null;
                    return (
                        <Button
                            key={item._id}
                            variant="ghost"
                            className={`w-full justify-start pl-2 ${currentChannel?._id === item._id ? "bg-primary/20" : ""}`}
                            onClick={() =>
                                selectChannel({
                                    _id: item._id,
                                    name: item.name,
                                    type: type,
                                    userId: null,
                                })
                            }
                        >
                            <Icon className="h-4 w-4 mr-2" />

                            {type === "private" ? item.user?.name : item.name}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};
