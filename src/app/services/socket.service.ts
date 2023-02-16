import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  id:any;
  CallRequestAccepted = this.socket.fromEvent('CallRequestAccepted');
  messageReceived = this.socket.fromEvent('agentMessage');
  agentDisconnected = this.socket.fromEvent('agentDisconnected');
  constructor(private socket: Socket) { }
  async connectSocket() {
    await this.socket.emit('Connected');
  }

  callRequest(obj:any){
    this.socket.emit('CallRequest',obj);
  }

  userCallAccept(obj:any){
    this.socket.emit('UserCallAccept',obj);
  }

  userSendMessage(obj:any){
    this.socket.emit('userSendMessage',obj);
  }
  callDicconnected(obj:any){
    this.socket.emit('UserDisconnect',obj);
  }
  getSocket(){
    return this.socket;
  }
}
