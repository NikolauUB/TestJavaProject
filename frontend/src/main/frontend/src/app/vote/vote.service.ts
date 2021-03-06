import { Injectable }    from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { VoteData } from '../model/VoteData';
import {CompetitionInfo} from "../model/CompetitionInfo";
import {AuthData} from "../model/auth/AuthData";
import { VoteStatistic } from '../model/votestatistic/VoteStatistic';

@Injectable()
export class VoteService {
  private postHeaders: Headers;
  private voteDataUrl = 'api/votedata?type=';
  private voteDataByIdUrl = 'api/votedata?type=-1&cid=';
  private voteUrl = 'api/vote';
  private deleteVoteUrl = 'api/deleteVote?cid=';
  private voteStatisticUrl = 'api/votestatistic?cid=';

  constructor(private http: Http) { }

  private setCSRFHeaders(token: string): void {
    this.postHeaders = new Headers({'Content-Type': 'application/json', 'X-CSRF-TOKEN': token});
  }

  getVoteItems(type): Promise<CompetitionInfo> {
    return this.http.get(this.voteDataUrl + type)
      .toPromise()
      .then(response => response.json() as CompetitionInfo)
      .catch(this.handleError);
  }
  getVoteItemsByCompId(compId): Promise<CompetitionInfo> {
      return this.http.get(this.voteDataByIdUrl + compId)
        .toPromise()
        .then(response => response.json() as CompetitionInfo)
        .catch(this.handleError);
    }

  getVoteStatistic(compId): Promise<VoteStatistic> {
    return this.http.get(this.voteStatisticUrl + compId)
      .toPromise()
      .then(response => response.json() as VoteStatistic)
      .catch(this.handleError);
  }

  vote(voteData: VoteData[], authData: AuthData): Promise<any>  {
    this.setCSRFHeaders(authData.tkn);
    return this.http
      .post(this.voteUrl,
        JSON.stringify(voteData),
        {headers: this.postHeaders})
      .toPromise()
      .catch(this.handleError);
  }

  deleteVote(compId: number, authData: AuthData): Promise<any>  {
    this.setCSRFHeaders(authData.tkn);
    return this.http
        .delete(this.deleteVoteUrl + compId,
        {headers: this.postHeaders})
        .toPromise()
        .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred in Vote service', error);
    return Promise.reject(error.message || error);
  }
}
