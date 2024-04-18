import {
    IAppAccessors, IHttp,
    ILogger, IModify, IPersistence, IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import {IEmailDescriptor, IPreEmailSent, IPreEmailSentContext} from '@rocket.chat/apps-engine/definition/email';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import {IPostRoomCreate, IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import {IUser} from '@rocket.chat/apps-engine/definition/users';
import {sendMessage} from './src/lib/message';

export class PsEventInterfacesListenersApp extends App implements IPostRoomCreate, IPreEmailSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
        console.debug('PsEventInterfacesListenersApp - Constructor');
    }

    public executePostRoomCreate(room: IRoom, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        console.debug(' ************************************************* ');
        console.debug(' * EVENT-INTERFACES-EXAMPLE - POST ROOM CREATION * ');
        console.debug(' *************************************************  ');
        read.getUserReader().getAppUser().then((user: IUser | undefined) => {
            if (user) {
                sendMessage(modify, room, user, 'Welcome to your new Room. This message comes from EVENT-INTERFACES-EXAMPLE ');
            } else {
                console.debug(' APP USER IS UNDEFINED  ');
            }
        }).catch((error) => {
            // Handle any errors that might occur during the promise resolution
        });
        return Promise.resolve(undefined);
    }

    public executePreEmailSent(context: IPreEmailSentContext, read: IRead, http: IHttp, persis: IPersistence, modify: IModify): Promise<IEmailDescriptor> {
        console.debug(' ************************************************* ');
        console.debug(' * EVENT-INTERFACES-EXAMPLE - PRE EMAIL SENT     * ');
        console.debug(' *************************************************  ');
        // Dummy IEmailDescriptor to satisfy the return type requirement.
        const dummyEmailDescriptor: IEmailDescriptor = {
            to: ['user@rocket.chat'],
            from: 'no-reply@ps-event-interfaces.com',
            subject: 'Mailer Message from PS Event Interfaces ',
            text : 'Hello dear [user] \n' +
                ' We are happy to show you the event of executePreEmailSent.\n\n' +
                ' The context object contains the data from the original email, like the email text : \n\n ' + context.email.text,
        };
        return Promise.resolve(dummyEmailDescriptor);
    }
}
