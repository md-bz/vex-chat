import { useChatStore } from "@/lib/store";
import { Input } from "../ui/input";
import { useState } from "react";
import { useChannels, useMessages } from "@/lib/hooks";
import { Button } from "../ui/button";
import { SendIcon } from "lucide-react";

export function ChatInput() {
    const [messageText, setMessageText] = useState("");
    const { currentChannel } = useChatStore();
    const { createChannel } = useChannels();
    const { sendMessage } = useMessages(currentChannel?._id || null);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !currentChannel) return;
        if (currentChannel._id === null) {
            if (!currentChannel.userId) return;
            const id = await createChannel(currentChannel.name, "private", [
                currentChannel.userId,
            ]);
            currentChannel._id = id;
        }

        sendMessage({
            channelId: currentChannel._id,
            text: messageText,
            timestamp: new Date().toISOString(),
        });
        setMessageText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="p-1">
            <div className="flex gap-2">
                <Input
                    placeholder={`Message ${currentChannel?.name}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                />
                <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                >
                    <SendIcon className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
