import { useChatStore } from "@/lib/store";
import { useChannels } from "@/lib/hooks";
import {
    HashIcon,
    UsersIcon,
    MessageCircleIcon,
    MessageSquareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTime } from "@/lib/utils";

export const ChatList = () => {
    const { currentChannel, selectChannel } = useChatStore();
    let { allChannels } = useChannels();

    const tabs = [
        {
            id: "all",
            label: "All Chats",
            icon: MessageSquareIcon,
            items: allChannels,
        },
        {
            id: "channels",
            label: "Channels",
            icon: HashIcon,
            items: allChannels.filter((c) => c.type === "channel"),
        },
        {
            id: "groups",
            label: "Groups",
            icon: UsersIcon,
            items: allChannels.filter((c) => c.type === "group"),
        },
        {
            id: "private",
            label: "Private",
            icon: MessageCircleIcon,
            items: allChannels.filter((c) => c.type === "private"),
        },
    ];

    const getLastMessagePreview = (messages: any[]) => {
        if (!messages || messages.length === 0) return null;
        const lastMessage = messages[messages.length - 1];
        return {
            text: lastMessage.text,
            time: formatTime(lastMessage._creationTime),
        };
    };

    return (
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <TabsTrigger key={tab.id} value={tab.id}>
                            <Icon className="h-4 w-4" />
                        </TabsTrigger>
                    );
                })}
            </TabsList>

            {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
                    <div className="space-y-1">
                        {tab.items?.map((item) => {
                            if (!item) return null;
                            const lastMessage = getLastMessagePreview(
                                item.messages
                            );

                            return (
                                <Button
                                    key={item._id}
                                    variant="ghost"
                                    className={`w-full justify-start pl-2 h-auto py-2 ${
                                        currentChannel?._id === item._id
                                            ? "bg-primary/20"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        selectChannel({
                                            _id: item._id,
                                            name: item.name,
                                            type: item.type,
                                            //@ts-ignore
                                            userId: item.user?._id || null,
                                        })
                                    }
                                >
                                    <div className="flex flex-col items-start w-full">
                                        <div className="flex items-center w-full">
                                            <tab.icon className="h-4 w-4 mr-2 " />
                                            <span className="font-medium truncate">
                                                {item.type === "private"
                                                    ? //@ts-ignore
                                                      item.user?.name
                                                    : item.name}
                                            </span>
                                            {lastMessage && (
                                                <span className="ml-auto text-xs text-muted-foreground">
                                                    {lastMessage.time}
                                                </span>
                                            )}
                                        </div>
                                        {lastMessage && (
                                            <p className="text-muted-foreground truncate w-full text-start">
                                                {lastMessage.text}
                                            </p>
                                        )}
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    );
};
