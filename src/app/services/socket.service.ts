import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  id:any;
  agentAcceptedCall = this.socket.fromEvent('CallRequestAccepted');
  screenShareStarted = this.socket.fromEvent('screenShareStarted');
  screenShareStoped = this.socket.fromEvent('screenShareStoped');
  messageReceived = this.socket.fromEvent('agentMessage');
  agentDisconnected = this.socket.fromEvent('agentDisconnected');
  constructor(private socket: Socket) { }
  async connectSocket() {
    await this.socket.emit('Connected');
  }

  callRequestToAgent(obj:any){
    this.socket.emit('CallRequest',obj);
  }

  userCallAccept(obj:any){
    this.socket.emit('UserCallAccept',obj);
  }
  
  speechText(obj:any){
    this.socket.emit('speechText',obj);
  }

  sendMessage(obj:any){
    this.socket.emit('userSendMessage',obj);
  }
  callDicconnected(obj:any){
    this.socket.emit('UserDisconnect',obj);
  }
  getSocket(){
    return this.socket;
  }
}
