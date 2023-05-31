import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UUID } from 'angular2-uuid';
@Injectable({
  providedIn: 'root'
})
export class TwilioService {

  baseUrl = 'http://localhost:5000';
  constructor(private http: HttpClient) { }
  getAgoraToken(userName:number, channel:any) {
    let obj ={
      "userUid": userName,
      "channelName": channel,
      "role": 0
    }
    return this.http.post('https://viewpro.com/api/agentRoutes/agoraToken',obj);
  }

  getAgentImage() {
    return this.http.get('https://viewpro.com/api/userRoutes/conversationAndVideoRoom');
  }
}
