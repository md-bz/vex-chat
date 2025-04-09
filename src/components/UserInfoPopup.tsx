"use client";

import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { User } from "@/lib/types";
import UserProfile from "./UserProfile";
import { Button } from "./ui/button";
import { useChatStore } from "@/lib/store";
import { useContacts } from "@/lib/hooks";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, XIcon } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackIcon } from "./ui/back-icon";

interface UserInfoProps {
    user: User;
    children?: React.ReactNode;
}

export default function UserInfoPopup({ user, children }: UserInfoProps) {
    const [open, setOpen] = useState(false);
    const [addContactOpen, setAddContactOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const { selectChannel } = useChatStore();
    const { addContact, deleteContact, contacts } = useContacts();
    const [name, setName] = useState(user.name);

    const isContact = contacts.some(
        (contact) => contact?.contactId === user._id
    );
    const contact = contacts.find((contact) => contact?.contactId === user._id);

    const handleSendMessage = async () => {
        selectChannel({
            _id: null,
            name: user.name,
            type: "private",
            userId: user._id,
        });
        setOpen(false);
    };

    const handleAddContact = async (name: string) => {
        try {
            await addContact(user._id, name);
            setAddContactOpen(false);
        } catch (error) {
            console.error("Error adding contact:", error);
        }
    };

    const handleDeleteContact = async () => {
        if (!contact) return;
        try {
            await deleteContact(contact._id);
            setDeleteConfirmOpen(false);
            setOpen(false);
        } catch (error) {
            console.error("Error deleting contact:", error);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <div className="hover:cursor-pointer">{children}</div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex flex-row items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => setOpen(false)}
                            >
                                <XIcon className="h-4 w-4 not-md:hidden" />
                                <BackIcon className="md:hidden" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {!isContact ? (
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setAddContactOpen(true)
                                            }
                                        >
                                            Add to Contacts
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setDeleteConfirmOpen(true)
                                            }
                                            className="text-destructive focus:text-destructive"
                                        >
                                            Delete Contact
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <DialogTitle>
                            <UserProfile user={user} />
                        </DialogTitle>
                    </DialogHeader>
                    <div className="w-full border-0 shadow-none">
                        <div className="flex flex-col space-y-2 pt-0">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="px-2 py-1 text-xs"
                                >
                                    ID: {String(user._id)}
                                </Badge>
                            </div>
                            <Button onClick={handleSendMessage}>
                                send message
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Contact Dialog */}
            <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Contact</DialogTitle>
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
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            onClick={async () => {
                                await handleAddContact(name);
                                setAddContactOpen(false);
                            }}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove {user.name} from your contacts.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteContact}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
