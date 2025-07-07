import React, { useState } from "react";
import { Edit, Trash2, Reply } from "lucide-react";
import { useSelectMessageStore } from "@/lib/store";
import { useMessages } from "@/lib/hooks";
import { Message, User } from "@/lib/types";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MessageMenuProps {
    message: Message;
    me: User;
    children: React.ReactNode;
}

export default function MessageMenu({
    message,
    me,
    children,
}: MessageMenuProps) {
    const { setSelectedMessage } = useSelectMessageStore();
    const { deleteMessage } = useMessages();
    const [open, setOpen] = useState(false);

    const handleEdit = () => {
        setSelectedMessage(message, "edit");
    };

    const handleReply = () => {
        setSelectedMessage(message, "reply");
    };

    const handleDelete = () => {
        deleteMessage(message._id);
        setOpen(false);
    };

    function DeleteConfirmation() {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete message?</DialogTitle>
                    </DialogHeader>
                    <p>
                        This action cannot be undone. Are you sure you want to
                        delete this message?
                    </p>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={handleReply}>
                    <Reply className="h-4 w-4 mr-2" /> Reply
                </ContextMenuItem>
                {message.userId === me._id && (
                    <>
                        <ContextMenuItem onClick={handleEdit}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                        </ContextMenuItem>
                        <ContextMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setOpen(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
            <DeleteConfirmation />
        </ContextMenu>
    );
}
