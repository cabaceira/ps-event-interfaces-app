import type { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { BlockBuilder, IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

/**
 * Gets a direct message room between bot and another user, creating if it doesn't exist
 *
 * @param read
 * @param modify
 * @param appUser
 * @param username the username to create a direct with bot
 * @returns the room or undefined if botUser or botUsername is not set
 */
export async function getDirect(read: IRead, modify: IModify, appUser: IUser, username: string): Promise<IRoom | undefined> {
    const usernames = [appUser.username, username];
    let room: IRoom;
    try {
        room = await read.getRoomReader().getDirectByUsernames(usernames);
    } catch (error) {
        return;
    }

    if (room) {
        return room;
    }

    // Create direct room between botUser and username
    const newRoom = modify
        .getCreator()
        .startRoom()
        .setType(RoomType.DIRECT_MESSAGE)
        .setCreator(appUser)
        .setMembersToBeAddedByUsernames(usernames);
    const roomId = await modify.getCreator().finish(newRoom);
    return read.getRoomReader().getById(roomId);
}

export async function sendMessage(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    blocks?: BlockBuilder | [IBlock],
    imageBase64?: string,
): Promise<string> {
    const msg = modify.getCreator().startMessage().setSender(sender).setRoom(room).setGroupable(false).setParseUrls(true).setText(message);

    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }
    if (imageBase64) {
        msg.setAttachments([
            {
                // image/jpeg to base64
                imageUrl: imageBase64,
            },
        ]);
    }

    return modify.getCreator().finish(msg);
}

export async function sendMessageSpecial(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    blocks?: BlockBuilder | [IBlock],
    imageBase64?: string,
): Promise<string> {
    const msg = modify.getCreator().startMessage().setSender(sender).setRoom(room).setGroupable(false).setParseUrls(true).setText(message);

    if (blocks !== undefined) {
        msg.setBlocks(blocks);
    }
    if (imageBase64) {
        msg.setAttachments([
            {
                // image/jpeg to base64
                imageUrl: imageBase64,
            },
        ]);
    }

    return modify.getCreator().finish(msg);
}

export async function sendNotification(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    message: string,
    blocks?: BlockBuilder,
    thumbnails?: Array<string>,
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;

    const msg = modify.getCreator().startMessage().setSender(appUser).setRoom(room).setText(message);

    if (blocks) {
        msg.setBlocks(blocks);
    }

    if (thumbnails?.length) {
        msg.setAttachments(
            thumbnails.map((thumbnail) => {
                return {
                    imageUrl: thumbnail,
                };
            }),
        );
    }

    return read.getNotifier().notifyUser(user, msg.getMessage());
}

export async function sendDirectMessage(
    read: IRead,
    modify: IModify,
    user: IUser,
    message: string,
    blocks?: BlockBuilder | [IBlock],
): Promise<string> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const targetRoom = (await getDirect(read, modify, appUser, user.username)) as IRoom;

    return sendMessage(modify, targetRoom, appUser, message, blocks);
}

export function isUserHighHierarchy(user: IUser): boolean {
    const clearanceList = ['admin', 'owner', 'moderator'];
    return user.roles.some((role) => clearanceList.includes(role));
}

export async function buildDataObjectMinutesFromNow(minutes: number, fileId: string): Promise<string> {
    const currentDate = new Date();

    // Calculate the future date based on the specified minutes
    const futureDate = new Date(currentDate.getTime() + minutes * 60000); // 1 minute = 60000 milliseconds

    // Format the date components
    const year = futureDate.getUTCFullYear();
    const month = padWithZero(futureDate.getUTCMonth() + 1); // Months are zero-based
    const day = padWithZero(futureDate.getUTCDate());
    const hours = padWithZero(futureDate.getUTCHours());
    const minutesComponent = padWithZero(futureDate.getUTCMinutes());
    const seconds = padWithZero(futureDate.getUTCSeconds());
    const milliseconds = padMilliseconds(futureDate.getUTCMilliseconds());

    // Construct the data object
    const dataObject = {
        nodeId: fileId,
        expiresAt: `${year}-${month}-${day}T${hours}:${minutesComponent}:${seconds}.${milliseconds}+0000`,
    };

    // Convert the data object to a JSON string
    const jsonData = JSON.stringify(dataObject);

    return jsonData;
}

export async function calculateDateXDaysFromNow(days: number): Promise<string> {
    const currentDate = new Date();

    // Calculate the future date based on the specified days
    const futureDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000); // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
    // Add 5 minutes to the future date
    futureDate.setMinutes(futureDate.getMinutes() + 5);
    // Format the date components
    const year = futureDate.getUTCFullYear();
    const month = padWithZero(futureDate.getUTCMonth() + 1); // Months are zero-based
    const day = padWithZero(futureDate.getUTCDate());
    const hours = padWithZero(futureDate.getUTCHours());
    const minutesComponent = padWithZero(futureDate.getUTCMinutes());
    const seconds = padWithZero(futureDate.getUTCSeconds());
    const milliseconds = padMilliseconds(futureDate.getUTCMilliseconds());

    // Construct the formatted date string
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutesComponent}:${seconds}.${milliseconds}+0000`;

    return formattedDate;
}

export async function buildDataObjectDaysFromNow(days: number, fileId: string): Promise<string> {
    const currentDate = new Date();

    // Calculate the future date based on the specified days
    const futureDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000); // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds

    // Add 5 minutes to the future date
    futureDate.setMinutes(futureDate.getMinutes() + 5);

    // Format the date components
    const year = futureDate.getUTCFullYear();
    const month = padWithZero(futureDate.getUTCMonth() + 1); // Months are zero-based
    const day = padWithZero(futureDate.getUTCDate());
    const hours = padWithZero(futureDate.getUTCHours());
    const minutesComponent = padWithZero(futureDate.getUTCMinutes());
    const seconds = padWithZero(futureDate.getUTCSeconds());
    const milliseconds = padMilliseconds(futureDate.getUTCMilliseconds());

    // Construct the data object
    const dataObject = {
        nodeId: fileId,
        expiresAt: `${year}-${month}-${day}T${hours}:${minutesComponent}:${seconds}.${milliseconds}+0000`,
    };

    // Convert the data object to a JSON string
    const jsonData = JSON.stringify(dataObject);

    return jsonData;
}

function padWithZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
}

function padMilliseconds(milliseconds: number): string {
    return milliseconds < 10 ? `00${milliseconds}` : milliseconds < 100 ? `0${milliseconds}` : `${milliseconds}`;

}
