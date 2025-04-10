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

    return (
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="flex items-center gap-1"
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {tab.label}
                            </span>
                        </TabsTrigger>
                    );
                })}
            </TabsList>

            {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
                    <div className="space-y-1">
                        {tab.items?.map((item) => {
                            if (!item) return null;
                            return (
                                <Button
                                    key={item._id}
                                    variant="ghost"
                                    className={`w-full justify-start pl-2 ${
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
                                    <tab.icon className="h-4 w-4 mr-2" />
                                    {item.type === "private"
                                        ? //@ts-ignore
                                          item.user?.name
                                        : item.name}
                                </Button>
                            );
                        })}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    );
};
