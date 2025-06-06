import { Dexie, Table } from "dexie";
import { Message } from "./types";

export const db = new Dexie("AppDatabase") as Dexie & {
    messages: Table<Message, string>;
    // channels: Table<Channel, number>;
};

// Schema declaration:
db.version(2).stores({
    messages: "&_id, channelId, [channelId+_creationTime]",
    // channels: "++id,_id, lastAvailableMessage",
});
