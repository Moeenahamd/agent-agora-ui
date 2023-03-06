import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class TwilioService {

  baseUrl = 'http://localhost:5000';
  constructor(private http: HttpClient) { }
  getAccessToken(userName:any, roomName:any) {
    const obj ={
      "userName": userName,
      "roomName": roomName
    }
    return this.http.post('https://viewpro.com/api/userRoutes/conversationAndVideoRoom',obj);
  }
  getAgoraToken(userName:number, id:any) {
    const obj ={
      "userUid": userName,
      "channelName": "ViewProProduction",
      "role": 0
    }
    return this.http.post('https://viewpro.com/api/agentRoutes/agoraToken',obj);
  }

  getAgentImage() {
    return this.http.get('https://viewpro.com/api/userRoutes/conversationAndVideoRoom');
  }
}
