import ContactsList from "@/components/ContactsList";
import { BackIcon } from "@/components/ui/back-icon";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function ContactsPage() {
    return (
        <>
            <div className="flex items-center pb-4 gap-2">
                <Link
                    href={"/chat"}
                    className={buttonVariants({ variant: "ghost" })}
                >
                    <BackIcon />
                </Link>
                <p>Contacts</p>
            </div>

            <ContactsList />
        </>
    );
}
