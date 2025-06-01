import HandleSignup from "@/components/HandleSignup";
import { SignedIn, SignIn } from "@clerk/nextjs";
import { shadesOfPurple } from "@clerk/themes";

export default function Home() {
    return (
        <main className="flex h-screen-svh flex-col items-center justify-center p-4">
            <SignIn
                fallbackRedirectUrl="/"
                routing="hash"
                appearance={{ baseTheme: shadesOfPurple }}
            />
            <SignedIn>
                <HandleSignup />
            </SignedIn>
        </main>
    );
}
