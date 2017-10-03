import {Component, AfterViewInit, Inject, ChangeDetectorRef} from "@angular/core";
import {DiscussionItem} from "../../model/DiscussionItem";
import {VotingThread} from "../../model/VotingThread";
import { OpinionService } from "./opinion.service";
import  {AuthService } from "../../auth/auth.service";
import { Router } from '@angular/router';
import { CompetitionShortInfo} from "../../partaking/CompetitionShortInfo";
import {ChangesController} from "../../changescontrol/changes.controller";
import {DetailsController} from "../../auth/userdetails/details.controller";
import { UserData } from '../../model/auth/UserData';

declare var nicEditor: any;

@Component({
    selector: 'opinions-app',
    templateUrl: './opinions.component.html',
    styleUrls: [ '../voting.component.css' ]
})
export class OpinionsComponent implements AfterViewInit {
    nicEdit: any;
    nicEditE: any;
    newOpinionItem: DiscussionItem = new DiscussionItem();
    editItemId: number = -1;
    votingThread: VotingThread = new VotingThread();
    browserCanWorkWithIndexedDB: boolean = false;
    idOfFirstPageItem: number = null;
    editErrorMsg: string;


    opinionErrorMsg: string;
    constructor(private opinionService: OpinionService,
                private authService: AuthService,
                private router: Router,
                private userDetailsController: DetailsController,
                private changesController: ChangesController,
                private competitionShortInfo: CompetitionShortInfo,
                @Inject(ChangeDetectorRef) private changeDetectorRef: ChangeDetectorRef) {

    }

    public isAutheticated(): boolean {
        return (this.authService && this.authService.getAuth()) ? this.authService.getAuth().auth : false;
    }

    public viewPreviousPage(): void {
        this.opinionService
            .getVotingOpinions(this.competitionShortInfo.compId, this.idOfFirstPageItem, null)
            .then(reply => this.sortThread(reply))
            .catch(e => this.handleError(e));


    }

    public replyTo(item: DiscussionItem):void {
        var shortText = (item.msgText.length > 700) ? item.msgText.substring(0, 697) + "..." : item.msgText;
        var quota = "<small><b>Ответ на сообщение:</b></small><br/><table border='1' cellpadding='10' cellpadding='10' style='width:90%'>"
            + "<tr><td><b>Автор:&nbsp;</b>" + item.authorUsername + "</td><td><b>Сообщение от:&nbsp;</b>" + this.convertTimeToDate(item.creationDate) + "</td></tr>"
            + "<tr><td colspan='2'>" + shortText + "</td></tr></table><br/><br/>";
        this.nicEdit.instanceById('nickEdit').setContent(quota);
        this.editItemId = -1;
        window.scrollTo(0,document.body.scrollHeight);
    }

    public hasPrevious(): boolean {
        if (this.votingThread.yc === -1) {
           return  ((this.votingThread.ac - 10) > 0);
        } else {
            return (this.votingThread.yc > 0);
        }
    }

    public hasNext(): boolean {
        return (this.votingThread.yc !== -1);
    }

    public getOpinionCount(): string {
        if (this.votingThread.yc === -1) {
            return  " ( " + (this.votingThread.ac - 10) + " )";
        } else {
            return  " ( " + this.votingThread.yc + " )";
        }
    }

    ngAfterViewInit() {
        if (this.isAutheticated()) {
            this.nicEdit = new nicEditor({
                buttonList: ['bold', 'italic', 'underline', 'left', 'center', 'right', 'justify',
                    'ol', 'ul', 'subscript', 'superscript', 'strikethrough', 'removeformat',
                    'indent', 'outdent', 'hr', 'image', 'forecolor', 'bgcolor', 'link', 'unlink',
                    'fontSize', 'fontFamily', 'fontFormat', 'xhtml']
                }).panelInstance('nickEdit');
        }
        this.browserCanWorkWithIndexedDB = this.changesController.isBrowserVersionFittable();
        this.loadOpinionsFirstPage();
    }

    public loadOpinionsFirstPage(): void {
        this.opinionService
            .getVotingOpinions(this.competitionShortInfo.compId, null, null)
            .then(reply => this.sortThread(reply))
            .catch(e => this.handleError(e));
    }

    private sortThread(reply: VotingThread) {
        this.votingThread = reply;
        if (this.votingThread.oi.length > 0) {
            this.votingThread.oi.sort((i1, i2) => {
               if (i1.msgId > i2.msgId) {
                   return 1;
               }
               if (i1.msgId < i2.msgId) {
                   return -1;
               }
               return 0;
            });
            this.votingThread.oi.forEach((item, i) => {
                if (i === 0) {
                    this.idOfFirstPageItem = item.msgId;
                }
                this.getAuthorDetails(item);
            });
        }
    }
    public deleteItem(item: DiscussionItem): void {

        if (this.isAutheticated() && confirm("Соообщения не могут быть восстановлены после удаления. Продолжить?")) {
            this.opinionService.deleteOpinionItem(item)
                .then(e => this.removeFromList(item))
                .catch(e =>this.handleError(e));
        }
    }

    private removeFromList(item: DiscussionItem): void {
        this.votingThread.oi = this.votingThread.oi.filter((itm)=>{
            return itm.msgId !== item.msgId;
}       );
    }

    public createItem(item: DiscussionItem): void {
        if (this.isAutheticated()) {
            item.authorId = this.authService.getAuth().uId;
            item.competitionId = this.competitionShortInfo.compId;
            if (this.saveItem(item, this.nicEdit.instanceById('nickEdit').getContent())) {
                this.nicEdit.instanceById('nickEdit').setContent("");
                this.editErrorMsg = null;
            }
        }
    }
    public isItemEditting(item: DiscussionItem): boolean {
        return (this.editItemId !== -1) && (this.editItemId === item.msgId);
    }

    public editItem(item: DiscussionItem): void {
        this.editErrorMsg = null;
        this.editItemId = item.msgId;
        this.changeDetectorRef.detectChanges();
        this.nicEditE = new nicEditor({
            buttonList: ['bold', 'italic', 'underline', 'left', 'center', 'right', 'justify',
                'ol', 'ul', 'subscript', 'superscript', 'strikethrough', 'removeformat',
                'indent', 'outdent', 'hr', 'image', 'forecolor', 'bgcolor', 'link', 'unlink',
                'fontSize', 'fontFamily', 'fontFormat', 'xhtml'],
            width: (window.innerWidth*2)/3
        }).panelInstance('nickEditE');
        this.nicEditE.instanceById('nickEditE').setContent(item.msgText);
    }
    public cancelEdit(): void {
        this.editItemId = -1;
        this.editErrorMsg = null;
    }



    public updateItem(item: DiscussionItem): void {
        if (this.saveItem(item, this.nicEditE.instanceById('nickEditE').getContent())){
            this.editItemId = -1;
            this.editErrorMsg = null;
        }
    }

    private saveItem(item: DiscussionItem, msg: string): boolean {
        if (this.isAutheticated()) {
            if (msg.trim().length === 0) {
                this.editErrorMsg="Cообщение не может быть пустым";
                return false;
            }

            if (msg.length > 16384) {
                this.editErrorMsg="Объем одного сообщения ограничен размером 16 тыс символов. Размер текста превышен на " + (msg.length - 16384);
                return false;
            }
            if (item.msgText === msg) {
                this.editErrorMsg="Сообщение не было изменено";
                return false;
            }
            item.msgText = msg;
            this.opinionService
                .saveOpinionItem(item)
                .then(reply => this.treatResult(reply, item))
                .catch(e => this.handleError(e));
            return true;
        }
        return false;
    }

    private treatResult(replyItem: DiscussionItem, item: DiscussionItem): void {
        if (item.msgId == null) {
            this.loadOpinionsFirstPage();
        } else {
            item = replyItem;
        }

    }

    public cancelChanges(item: DiscussionItem): void {
        var msg = this.nicEdit.instanceById('nickEdit').getContent();
        if (item.msgText != msg) {
            this.nicEdit.instanceById('nickEdit').setContent((item.msgText) ? item.msgText : "");
        }
    }


    public convertTimeToDate(time: any): string {
        var d = new Date(time);
        return d.getDate() + '.' + (d.getMonth()+1) + '.' + d.getFullYear() + ', ' + d.getHours() + ':' + d.getMinutes();
    }

    public canEdit(item: DiscussionItem): boolean {
        return this.isAutheticated() && (item.authorId === this.authService.getAuth().uId);
    }

    public canReply(item: DiscussionItem): boolean {
        return this.isAutheticated() && (item.authorId !== this.authService.getAuth().uId);
    }

    public canDelete(item: DiscussionItem): boolean {
        return this.isAutheticated() && (item.authorId === this.authService.getAuth().uId);
    }

    public isUpdated(item: DiscussionItem): boolean {
        return item.updateDate !== item.creationDate;
    }


    protected handleError(e: any) : void {
        if(e.status === 403) {
            alert("Ваша сессия не активна. Пожалуйста, зайдите на сайт!");
            this.router.navigateByUrl("login");
        } else {
            this.opinionErrorMsg = e.json().message || e.toString();
        }
    }

    private getAuthorDetails(item: DiscussionItem): void {
        item.authorUsername = "Пользователь " + item.authorId;
        item.authorAvatar = DetailsController.defaultAvatar;
        if (this.browserCanWorkWithIndexedDB) {
            this.userDetailsController.loadUserDetails(item);
        } else {
            this.userDetailsController
                    .loadUserDetailInItemAndUserDataByIdFromDB(item);
        }
    }

}