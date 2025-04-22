import { BackIcon } from "../ui/back-icon";
import { useChatStore } from "@/lib/store";
import ChannelInfoPopup from "../ChannelInfoPopup";
import { ChannelIcon } from "../ui/channel-icon";
import { Channel, User } from "@/lib/types";
import UserInfoPopup from "../UserInfoPopup";
import UserProfile from "../UserProfile";
import { useUsers } from "@/lib/hooks";

export function ChatTopBar({ channelInfo }: { channelInfo: Channel }) {
    const { selectChannel, currentChannel } = useChatStore();
    const { getUserById } = useUsers();
    const user = getUserById(
        currentChannel?.type === "private" ? currentChannel.userId : undefined
    );

    function ChannelTopInfo() {
        if (!channelInfo) {
            return null;
        }
        if (channelInfo.type !== "private") {
            return (
                <ChannelInfoPopup
                    id={channelInfo._id}
                    name={channelInfo.name}
                    type={channelInfo.type}
                    createdAt={channelInfo.createdAt}
                    members={channelInfo.members as User[]}
                    isAdmin={channelInfo.isAdmin}
                    inviteLink={channelInfo.link}
                >
                    <div className="flex items-center space-x-2">
                        <ChannelIcon type={channelInfo.type} />
                        <h2 className="ml-2 font-semibold">
                            {currentChannel?.name}
                        </h2>
                    </div>
                </ChannelInfoPopup>
            );
        }
        if (!user) return null;

        return (
            <UserInfoPopup user={user}>
                <UserProfile user={user} />
            </UserInfoPopup>
        );
    }
    return (
        <div className="px-3 py-4 border-b bg-card h-[70px] flex align-center">
            <div className="flex items-center">
                <button
                    onClick={() => selectChannel(null)}
                    className="mr-3 md:hidden"
                >
                    <BackIcon />
                </button>
                <ChannelTopInfo />
            </div>
        </div>
    );
}
export default ChatTopBar;
