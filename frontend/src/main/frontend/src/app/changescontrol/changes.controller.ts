import {Injectable} from "@angular/core";
import {ChangesService} from "./changes.service";
import {ChangesKeywords} from "./ChangesKeywords";
import {DetailsController} from "./../auth/userdetails/details.controller";
import {ThreadChanges} from "./ThreadChanges";

@Injectable()
export class ChangesController {
  public static PREVIOUS_TIME: string = "PREV_TIME";
  public static COMPETITION_LIST: string = "COMP_LIST";
  public static DESCRIPTION_CLASSIC: string = "DESC_0";
  public static DESCRIPTION_JAZZ: string = "DESC_1";
  public static DESCRIPTION_FREE: string = "DESC_2";
  public static DESCRIPTION_COMPOSITION: string = "DESC_3";
  public static DESCRIPTION_PREFIX: string = "DESC_";

  public static COMPETITION_MEMBERS_CLASSIC: string = "MBRS_0";
  public static COMPETITION_MEMBERS_JAZZ: string = "MBRS_1";
  public static COMPETITION_MEMBERS_FREE: string = "MBRS_2";
  public static COMPETITION_MEMBERS_COMPOSITION: string = "MBRS_3";
  public static COMPETITION_MEMBERS_PREFIX: string = "MBRS_";
  public static HIDE_PARTAKE_DISCUSS_PREFIX: string = "HD_";

  changesKeywords: ChangesKeywords;

  constructor(private changesService: ChangesService,
              private userDetailsController: DetailsController) {
    this.userDetailsController.createStore();
  }

  public checkChangesInThread(uTime: Date, thDate: Date, threadId: number): Promise<ThreadChanges> {
   return this.changesService
        .getThreadUpdates(uTime, thDate, threadId)
        .then(reply => this.cleanIndexedDBForUsers(reply))
        .catch(e => this.handleError(e));
  }

  private cleanIndexedDBForUsers(reply: ThreadChanges): ThreadChanges {
    reply.userIds.forEach((userId)=>{
      this.userDetailsController.cleanUserDetails(userId);
    });
    return reply;
  }

  public init(): boolean {
    //clean previous
    this.changesKeywords = null;
    var prevTime  = localStorage.getItem(ChangesController.PREVIOUS_TIME);
    var time: number = (prevTime == null) ? -1: parseInt(prevTime, 10);
    if (time === -1) {
      localStorage.removeItem(ChangesController.COMPETITION_LIST);
      localStorage.removeItem(ChangesController.DESCRIPTION_CLASSIC);
      localStorage.removeItem(ChangesController.DESCRIPTION_JAZZ);
      localStorage.removeItem(ChangesController.DESCRIPTION_FREE);
      localStorage.removeItem(ChangesController.DESCRIPTION_COMPOSITION);
      localStorage.removeItem(ChangesController.COMPETITION_MEMBERS_CLASSIC);
      localStorage.removeItem(ChangesController.COMPETITION_MEMBERS_JAZZ);
      localStorage.removeItem(ChangesController.COMPETITION_MEMBERS_FREE);
      localStorage.removeItem(ChangesController.COMPETITION_MEMBERS_COMPOSITION);
    }
    this.changesService
        .checkChanges(time)
        .then( reply => this.treatReply(reply))
        .catch(e => this.handleError(e));
    return true;
  }

  private treatReply(reply: any): void {
    this.changesKeywords = reply;
    localStorage.setItem(ChangesController.PREVIOUS_TIME, this.changesKeywords.time.toString());
    this.changesKeywords.keywords.forEach(keyword => localStorage.removeItem(keyword));
  }

  private handleError(e: any) : void {
    console.error(e.json().message || e.toString());
    alert(e.json().message || e.toString());
  }

}