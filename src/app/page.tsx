import HandleUsername from "@/components/HandleUsername";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome to VexChat</CardTitle>
                    <CardDescription>
                        Sign in to start chatting.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <SignedOut>
                        <SignIn fallbackRedirectUrl="/" />
                    </SignedOut>
                    <SignedIn>
                        <HandleUsername />
                    </SignedIn>
                </CardContent>
            </Card>
        </main>
    );
}
