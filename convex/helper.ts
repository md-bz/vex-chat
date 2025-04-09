import { Doc } from "./_generated/dataModel";

export function getSanitizedUser(user: Doc<"users">) {
    const { _creationTime, tokenIdentifier, ...sanitizedUser } = user;
    return sanitizedUser;
}
