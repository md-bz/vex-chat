import { useChatStore } from "@/lib/store";
import { useChannels, useUsers } from "@/lib/hooks";
import {
    HashIcon,
    UsersIcon,
    MessageCircleIcon,
    MessageSquareIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cssDirection, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./ui/scroll-area";

export const ChatList = () => {
    const { currentChannel, selectChannel } = useChatStore();
    let { allChannels } = useChannels();
    const { getMe } = useUsers();
    const me = getMe();

    const getUnreadCount = (channel: any, lastSeenTime: number) => {
        if (!channel.messages?.length) return 0;
        const unreadMessages = channel.messages.filter(
            (msg: any) => msg._creationTime > lastSeenTime
        );

        return unreadMessages.length;
    };

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
            items: allChannels?.filter((c) => c.type === "channel"),
        },
        {
            id: "groups",
            label: "Groups",
            icon: UsersIcon,
            items: allChannels?.filter((c) => c.type === "group"),
        },
        {
            id: "private",
            label: "Private",
            icon: MessageCircleIcon,
            items: allChannels?.filter((c) => c.type === "private"),
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
                    <ScrollArea className="h-[calc(100vh-200px)] not-sm:h-[calc(100vh-200px)]  space-y-1 overflow-y-scroll ">
                        {tab.items === undefined ? (
                            <>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="w-full px-2 py-2">
                                        <div className="flex flex-col items-start w-full gap-0.5">
                                            <div className="flex items-center w-full mb-1 gap-2">
                                                <Skeleton className="h-4 w-4 " />
                                                <Skeleton className="h-4 w-24" />
                                                <div className="ml-auto flex items-center gap-2">
                                                    <Skeleton className="h-3 w-10" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : tab.items === null ? (
                            <div className="w-full text-center text-muted-foreground py-4">
                                No messages yet, search for users to start
                                chatting
                            </div>
                        ) : (
                            tab.items.map((item) => {
                                if (!item) return null;
                                const lastMessage = getLastMessagePreview(
                                    item.messages
                                );

                                const myLastSeen =
                                    item.channelLastSeen.find(
                                        (c) => c?.userId === me?._id
                                    )?.lastSeenAt || 0;
                                const unreadCount = getUnreadCount(
                                    item,
                                    myLastSeen
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
                                                <tab.icon className="h-4 w-4 mr-2" />
                                                <span className="font-medium truncate">
                                                    {item.type === "private"
                                                        ? //@ts-ignore
                                                          item.user?.name
                                                        : item.name}
                                                </span>
                                                <div className="ml-auto flex items-center gap-2">
                                                    {lastMessage && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {lastMessage.time}
                                                        </span>
                                                    )}
                                                    {unreadCount > 0 && (
                                                        <Badge
                                                            variant="default"
                                                            className="h-5 w-6 p-0 flex items-center justify-center"
                                                        >
                                                            {unreadCount === 20
                                                                ? "20+"
                                                                : unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {lastMessage && (
                                                <p
                                                    className="text-muted-foreground truncate w-full text-start"
                                                    style={{
                                                        direction: cssDirection(
                                                            lastMessage.text
                                                        ),
                                                    }}
                                                >
                                                    {lastMessage.text}
                                                </p>
                                            )}
                                        </div>
                                    </Button>
                                );
                            })
                        )}
                    </ScrollArea>
                </TabsContent>
            ))}
        </Tabs>
    );
};
