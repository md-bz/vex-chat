"use client";
import { useChatStore, useSelectMessageStore } from "@/lib/store";
import { useState, useEffect, useRef } from "react";
import { useChannels, useMessages } from "@/lib/hooks";
import { Button } from "../ui/button";
import { ReplyIcon, SendIcon, SmileIcon, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { cssDirection } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

export function ChatInput() {
    const [messageText, setMessageText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { currentChannel } = useChatStore();
    const { createChannel } = useChannels();
    const { sendMessage, editMessage } = useMessages();
    const { selectedMessage, selectType, clearSelectedMessage } =
        useSelectMessageStore();

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const inputMaxHeight = 30; //based on shadcn units
    useEffect(() => {
        if (!textareaRef.current) return;

        if (messageText === "") {
            textareaRef.current.style.height = "2.5em";
        }
        textareaRef.current.style.height = `${Math.min(
            textareaRef.current.scrollHeight,
            inputMaxHeight * 4
        )}px`;
    }, [messageText]);

    // Update input text when editing message changes
    useEffect(() => {
        if (selectType === "edit" && selectedMessage) {
            return setMessageText(selectedMessage.text);
        }
        setMessageText("");
    }, [selectedMessage, selectType]);

    const handleSendMessage = async () => {
        if (!messageText || !currentChannel) return;

        const trimmedMessageText = messageText;
        if (selectType === "edit" && selectedMessage) {
            await editMessage(selectedMessage._id, trimmedMessageText);
            clearSelectedMessage();
            setMessageText("");
            return;
        }

        if (currentChannel._id === null) {
            if (!currentChannel.userId) return;
            const newChannel = await createChannel(
                currentChannel.name,
                "private",
                [currentChannel.userId]
            );
            currentChannel._id = newChannel._id;
        }

        sendMessage({
            channelId: currentChannel._id,
            text: trimmedMessageText,
            timestamp: new Date().toISOString(),
            replyTo: selectType === "reply" ? selectedMessage?._id : undefined,
        });
        setMessageText("");
        clearSelectedMessage();
        setShowEmojiPicker(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.ctrlKey) {
            e.preventDefault();
            handleSendMessage();
        } else if (e.key === "Enter" && e.ctrlKey) {
            setMessageText((prev) => prev + "\n");
        } else if (e.key === "Escape") {
            clearSelectedMessage();
            setMessageText("");
        }
    };

    const handleEmojiClick = (emojiData: any) => {
        setMessageText((prev) => prev + emojiData.emoji);
    };

    return (
        <div className="p-1 relative">
            {selectedMessage && selectType === "reply" && (
                <div className="bg-primary-foreground px-2 py-1 rounded mb-2 flex justify-between">
                    <div className="flex gap-1 items-center">
                        <ReplyIcon className="h-4 w-4" />
                        <p
                            className="overflow-hidden h-5 w-full text-muted-foreground break-words md:max-w-[calc(90vw-250px)] max-w-[calc(90vw-2rem)]"
                            style={{
                                direction: cssDirection(selectedMessage.text),
                            }}
                        >
                            {selectedMessage.text}
                        </p>
                    </div>
                    <button onClick={clearSelectedMessage} className="ml-2">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {selectedMessage && selectType === "edit" && (
                <div className="bg-primary-foreground px-2 py-1 rounded mb-2 flex justify-between">
                    <div className="flex gap-1 items-center">
                        <p className="text-muted-foreground">Editing message</p>
                    </div>
                    <button
                        onClick={() => {
                            clearSelectedMessage();
                            setMessageText("");
                        }}
                        className="ml-2"
                    >
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

                <Textarea
                    ref={textareaRef}
                    placeholder={`Message ${currentChannel?.name}...`}
                    style={{
                        direction:
                            cssDirection(messageText) === "rtl" ? "rtl" : "ltr",
                    }}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`flex-1 resize-none max-h-${inputMaxHeight}`}
                />

                <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                >
                    <SendIcon className="h-4 w-4" />
                </Button>
            </div>

            {showEmojiPicker && (
                <div className="absolute z-50 w-100 not-md:w-[calc(100vw-0.5em)] md:bottom-10 py-1">
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
