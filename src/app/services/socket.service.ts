import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { io } from "socket.io-client";

import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  id:any;
  socket:any;
  
  agentAcceptedCall : BehaviorSubject<string> = new BehaviorSubject('');
  socketConnection : BehaviorSubject<string> = new BehaviorSubject('');
  screenShareStarted : BehaviorSubject<string> = new BehaviorSubject('');
  screenShareStopped : BehaviorSubject<string> = new BehaviorSubject('');
  messageReceived : BehaviorSubject<string> = new BehaviorSubject('');
  agentDisconnected : BehaviorSubject<string> = new BehaviorSubject('');
  agentTransferCallEstablished : BehaviorSubject<string> = new BehaviorSubject('');
  
  constructor() { 
    
  }
  async initSocket(){
    this.socket = io('https://viewpro.com');
  }

  getMessageReceived = () => {
    this.socket.on('agentMessage', (message:any) =>{
      console.log(message)
      this.messageReceived.next(message);
    });

    return this.messageReceived.asObservable();
  };

  getAgentDisconnected = () => {
    this.socket.on('agentLeavedConversationRoom', (message:any) =>{
      console.log(message)
      this.agentDisconnected.next(message);
    });

    return this.agentDisconnected.asObservable();
  };

  getAgentTransferCallEstablished = () => {
    this.socket.on('AgentTransferCallEstablished', (message:any) =>{
      console.log(message)
      this.agentTransferCallEstablished.next(message);
    });

    return this.agentTransferCallEstablished.asObservable();
  };

  getCallRequestAccepted = () => {
    this.socket.on('CallRequestAccepted', (message:any) =>{
      console.log(message)
      this.agentAcceptedCall.next(message);
    });

    return this.agentAcceptedCall.asObservable();
  };

  getSocketConnection = () => {
    this.socket.on('connect', (message:any) =>{

      this.socketConnection.next(this.socket.id);
    });

    return this.socketConnection.asObservable();
  };

  getStartScreenShare = () => {
    this.socket.on('screenShareStarted', (resp:any) =>{

      this.screenShareStarted.next(resp);
    });

    return this.screenShareStarted.asObservable();
  };

  getStopScreenShare = () => {
    this.socket.on('screenShareStopped', (resp:any) =>{

      this.screenShareStopped.next(resp);
    });

    return this.screenShareStopped.asObservable();
  };
  
  async connectSocket() {
    console.log('called')
    await this.socket.emit('Connected');
  }

  async disConnectSocket() {
    await this.socket.emit('userDisconnect');
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
    console.log('callDicconnected')
    this.socket.emit('UserDisconnect',obj);
  }
  getSocket(){
    return this.socket;
  }
}
