import { useChatStore, useReplyMessageStore } from "@/lib/store";
import { Input } from "../ui/input";
import { useState } from "react";
import { useChannels, useMessages } from "@/lib/hooks";
import { Button } from "../ui/button";
import { ReplyIcon, SendIcon, SmileIcon, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

export function ChatInput() {
    const [messageText, setMessageText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { currentChannel } = useChatStore();
    const { createChannel } = useChannels();
    const { sendMessage } = useMessages(currentChannel?._id || null);
    const { replyMessage, clearReplyMessage } = useReplyMessageStore();

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
            replyTo: replyMessage?._id,
        });
        setMessageText("");
        clearReplyMessage();
        setShowEmojiPicker(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEmojiClick = (emojiData: any) => {
        setMessageText((prev) => prev + emojiData.emoji);
    };

    return (
        <div className="p-1 relative">
            {replyMessage && (
                <div className="bg-primary-foreground px-2 py-1 rounded mb-2 flex justify-between">
                    <div className="flex gap-1 items-center">
                        <ReplyIcon className="h-4 w-4" />
                        <p className="overflow-hidden h-5 w-full text-muted-foreground">
                            {replyMessage.text}
                        </p>
                    </div>
                    <button onClick={clearReplyMessage} className="ml-2">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex gap-2 items-center">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2"
                >
                    <SmileIcon className="h-5 w-5" />
                </Button>

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

            {showEmojiPicker && (
                <div className="absolute z-50 w-100 not-md:w-[98vw] md:bottom-10 py-1">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.DARK}
                        skinTonesDisabled={true}
                        previewConfig={{ showPreview: false }}
                        width="100%"
                    />
                </div>
            )}
        </div>
    );
}
