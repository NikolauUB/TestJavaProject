import {Component, ViewChild, OnInit} from "@angular/core";
import { ModalComponent } from "./modal.component";
import { VoteData } from '../model/VoteData';
import { DetailsController } from '../auth/userdetails/details.controller';
import { UserData } from '../model/auth/UserData';
import {ChangesController} from "../changescontrol/changes.controller";

@Component({
    selector: 'itemdetails-modal-component',
    templateUrl: './itemdetails.component.html',
    styleUrls: [ './modal.component.css' ]

})
export class ItemdetailsComponent implements OnInit{
    @ViewChild(ModalComponent)
    modal:ModalComponent = new ModalComponent();
    voteItem: VoteData = new VoteData();
    userDataMap: Map<number, UserData> = new Map<number, UserData>();

    constructor(private detailsController: DetailsController, private changesController: ChangesController) {
    }

    ngOnInit(): void {
    }

    public showDetails(item: VoteData) {
        this.voteItem = item;
        this.loadUserData();
        this.modal.show();
    }

    oneOrMany(): string {
        var result: string = "";
        if (this.voteItem.usernames && this.voteItem.usernames.length > 1) {
            result = "ы";
        }
        return result;
    }

    public getAvatar(userId: number): string {
        if (this.userDataMap.has(userId)) {
            return (this.userDataMap.get(userId).previewImage != null) ? this.userDataMap.get(userId).previewImage : "";
        }
        return "";
    }

    getUsername(userId: number): string {
        return this.userDataMap.get(userId).username;
    }

    getUsernameList(): string {
        return (this.voteItem.usernames) ? this.voteItem.usernames.join(', ') : "";
    }

    private loadUserData(): void {
        this.voteItem.userIds.forEach(id => {
            var userData = new UserData();
            userData.previewImage = DetailsController.defaultAvatar;
            this.detailsController.loadUserDetails(id, userData, this.changesController);    
            this.userDataMap.set(id, userData);
        });
    }
}