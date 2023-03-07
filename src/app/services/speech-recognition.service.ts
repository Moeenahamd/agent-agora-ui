import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
 
declare var webkitSpeechRecognition:any

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  recognition =  new webkitSpeechRecognition();
  isStoppedSpeechRecog = false;
  private text = '';
  socketId:any;
  tempWords!: string;
  constructor(
    private socketService: SocketService) { 
      
      this.socketService.connectSocket()
    }

  init(id:any) {
    this.socketId = id;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    this.recognition.addEventListener('result', (e: { results: Iterable<any> | ArrayLike<any>; }) => {
      const transcript = Array.from(e.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      this.tempWords = transcript;
    });
  }
 
  start() {
    this.isStoppedSpeechRecog = false;
    this.recognition.start();
    console.log("Speech recognition started")
    this.recognition.addEventListener('end', () => {
      const message:string =this.tempWords? this.tempWords :'';
      if(message.length>1){
        const payload = {
          "userSid" : this.socketId,
          "text": message+"."
        }
        this.socketService.speechText(payload);
      }
      this.tempWords = '';
      if (this.isStoppedSpeechRecog) {
        this.recognition.stop();
        console.log("End speech recognition")
      } else {
        this.recognition.start();
      }
    });
  }
  stop() {
    this.isStoppedSpeechRecog = true;
    this.recognition.stop();
    console.log("End speech recognition")
  }
}
