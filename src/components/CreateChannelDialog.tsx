"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useChannels } from "@/lib/hooks";
import { Id } from "../../convex/_generated/dataModel";

interface CreateChannelDialogProps {
    type: "channel" | "group";
    memberIds: Id<"users">[];
    onClose: () => void;
}

export default function CreateChannelDialog({
    type,
    memberIds,
    onClose,
}: CreateChannelDialogProps) {
    const [name, setName] = useState("");
    const { createChannel } = useChannels();

    const handleCreate = async () => {
        if (!name.trim()) return;

        await createChannel(name, type, memberIds);
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Create {type === "channel" ? "Channel" : "Group"}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder={`Enter ${type} name`}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {memberIds.length} members selected
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate}>Create</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
