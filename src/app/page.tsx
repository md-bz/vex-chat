import HandleUsername from "@/components/HandleUsername";
import { SignedIn, SignIn } from "@clerk/nextjs";
import { shadesOfPurple } from "@clerk/themes";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <SignIn
                fallbackRedirectUrl="/"
                routing="hash"
                appearance={{ baseTheme: shadesOfPurple }}
            />
            <SignedIn>
                <HandleUsername />
            </SignedIn>
        </main>
    );
}
