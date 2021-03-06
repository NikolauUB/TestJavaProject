import { UserData } from './auth/UserData';
export class DiscussionItem {
    competitionId: number;
    msgThreadId: number;
    msgId: number;
    parentMsgId: number;
    authorId: number;
    msgText: string;
    creationDate: Date;
    updateDate: Date;
    authorDetails: UserData = new UserData();
}
