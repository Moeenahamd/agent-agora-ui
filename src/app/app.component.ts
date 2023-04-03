import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { TwilioService } from './services/twilio.service';
import { UUID } from 'angular2-uuid';
import { SocketService } from './services/socket.service';
import AgoraRTC, { IAgoraRTCClient, LiveStreamingTranscodingConfig, ICameraVideoTrack, IMicrophoneAudioTrack, ScreenVideoTrackInitConfig, VideoEncoderConfiguration, AREAS, IRemoteAudioTrack, ClientRole } from "agora-rtc-sdk-ng"
import { ToastContainerDirective, ToastrService } from 'ngx-toastr';
import { SpeechRecognitionService } from './services/speech-recognition.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild ('localMediaContainer') localMediaContainer:any;
  @ViewChild ('remoteMediaContainer1') remoteMediaContainer1:any;
  @ViewChild ('remoteMediaContainer2') remoteMediaContainer2:any;
  @ViewChild ('remoteScreenContainer') remoteScreenContainer:any;
  
  @ViewChild('scrollBottom') scrollBottom: any;
  @ViewChild(ToastContainerDirective, { static: true })
  toastContainer: any;
  agoraClient:any;
  screenMode= false;
  agentName:any;
  contHeigth:any;
  agentImage:any = "url('../assets/background.png')";
  avatar:any = "https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg";
  options = {
    appId: "10cd14249e254391817d2b2ee69ae4ff",  // set your appid here
    channel: "ViewProProduction", // Set the channel name.
    token: '8ee0cc8992714c22bc4622613c06e413', // Pass a token if your project enables the App Certificate.
    uid: Math.floor((Math.random() * 1000) + 1)
  };
  constructor(
    private twilioService: TwilioService,
    private socketService: SocketService,
    private service : SpeechRecognitionService,
    private toastr: ToastrService,
    private el:ElementRef) { 
    }
  conversationToken:any;
  localParticipant:any;
  conversation:any;
  room:any;
  localAudioTracks:any;
  localVideoTracks:any;
  channelParameters =
  {
      // A variable to hold a local audio track.
      localAudioTrack: null,
      // A variable to hold a local video track.
      localVideoTrack: null,
      // A variable to hold a remote audio track.
      remoteAudioTrack: null,
      // A variable to hold a remote video track.
      remoteVideoTrack: null,
      // A variable to hold the remote user id.s
      remoteUid: null,
  };
  userSid:any;
  videoToken:any;
  userName:any;
  roomName:any;
  message:any;
  agentCount =0;
  users:any[] =[];
  videos:any[] = [];
  showButton = false;
  messages:any[]=[];
  videoMode = false;
  audioMode = false;
  chatButton = false;
  title = 'agent-ui';
  public loading = false;
  public videoPublished = false;
  public audioPublished = false;
  UserlocalVideoTrack:any;
  timerInterval: any;
  ngOnInit(): void {
    (this.el.nativeElement as HTMLElement).style.setProperty('--vh', window.innerHeight.toString()+"px");
    this.toastr.overlayContainer = this.toastContainer;
    this.socketService.connectSocket()
    this.socketService.screenShareStarted.subscribe((doc:any) => {
      this.screenMode = true;
      this.screenShare(doc.uid)
    });
    this.socketService.screenShareStopped.subscribe((doc:any) => {
      this.screenMode = false;
      this.agentsCalls();
    });
    this.socketService.agentAcceptedCall.subscribe((doc:any) => {
      this.loading = false;
      this.agentName = doc.agentName
      this.userSid = doc.userUid;
      if(doc.avatar && doc.avatar != ""){
        this.avatar = doc.avatar;
      }
      this.agentImage = doc.image;
      this.socketService.userCallAccept(doc);
    });
    this.twilioService.getAgentImage().subscribe((doc:any) => {
      this.agentImage = doc.img;
    });
    this.socketService.messageReceived.subscribe((doc:any) => {
      const payload ={
        'message':doc.message,
        'agentName':doc.agentName? doc.agentName:'Test'
      }
      this.messages.push(payload)
      this.scrollToBottom();
    });
    this.socketService.agentDisconnected.subscribe((doc:any) => {
      this.messages = [];
      this.toastr.success('Call disconnected or agent leaved')
    });
 
  }
  payload:any;
  agoraEngine:any
  async initAgoraClient(){
    this.agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    await this.agoraEngine.join(this.options.appId, this.options.channel,this.options.token, this.options.uid); 
    this.agoraEngine.on("user-published", async (user:any, mediaType:any) =>
    {

      await this.agoraEngine.subscribe(user, mediaType);
      if (mediaType === "video") {
        if(user._videoTrack){
          this.users.push(user)
        }
        this.agentsCalls();
      }
      if (mediaType == "audio")
      {
        var audio = user.audioTrack;
        audio.play();
      }
    });
    this.agoraEngine.on("user-unpublished", async (user:any, mediaType:any) =>
    {
      this.users = this.users.filter(x=> x != user);
      this.agentsCalls();
    });  
  }
  screenShare(uid?:any){
    uid = parseInt(uid);
    const user = this.users.findIndex(x=>x.uid == uid)
    this.remoteScreenContainer.nativeElement.style.width = "100%";
    this.remoteScreenContainer.nativeElement.style.height = "50%";
    this.remoteScreenContainer.nativeElement.style.position = 'absolute';
    this.remoteScreenContainer.nativeElement.style.top = '25%';
    this.users[user].videoTrack.play(this.remoteScreenContainer.nativeElement);
  }
  agentsCalls(){
    if(this.users.length == 1){
      this.remoteMediaContainer1.nativeElement.style.width = "100%";
      this.remoteMediaContainer1.nativeElement.style.height = "100%";
      this.remoteMediaContainer1.nativeElement.style.position = 'absolute';
      this.remoteMediaContainer1.nativeElement.style.left = '0px';
      this.users[0].videoTrack.play(this.remoteMediaContainer1.nativeElement);
    }
    else if(this.users.length == 2){
      
      this.remoteMediaContainer2.nativeElement.style.height = "50%";
      this.remoteMediaContainer2.nativeElement.style.width = "100%";
      this.remoteMediaContainer2.nativeElement.style.height = "50%";
      this.remoteMediaContainer2.nativeElement.style.position = 'absolute';
      this.remoteMediaContainer2.nativeElement.style.left = '0px';
      this.remoteMediaContainer2.nativeElement.style.top = '50%';
      this.users[1].videoTrack.play(this.remoteMediaContainer2.nativeElement);
      this.remoteMediaContainer1.nativeElement.style.height = "50%";
    }
  }
  getAccessToken(){
    this.service.start();
    this.chatButton = true;
    //this.loading = true;
    this.roomName = UUID.UUID()
    const socketObj=this.socketService.getSocket();
    this.localParticipant = socketObj.ioSocket.id;
    
    this.twilioService.getAgoraToken(this.options.uid, this.localParticipant).subscribe((data:any)=>{
      this.options.channel = data.channelName;
      this.options.token = data.tokenA;
      this.initAgoraClient();
      this.service.init(socketObj.ioSocket.id)
    })
    this.twilioService.getAccessToken(socketObj.ioSocket.id+this.roomName,this.roomName).subscribe((data:any)=>{
      this.conversationToken = data.conversationRoomAccessToken;
      this.videoToken = data.videoRoomAccessToken;
      this.payload ={
        userSid:this.socketService.id,
        roomName: this.roomName,
        conversationSID: data.conversationRoom.sid
      }
      this.timer();
      this.socketService.callRequestToAgent(this.payload);
    })
  }
  async unMuteVideo(){
    this.localVideoTracks = await AgoraRTC.createCameraVideoTrack();
    this.localMediaContainer.nativeElement.style.width = "115px";
    this.localMediaContainer.nativeElement.style.height = "115px";
    this.localMediaContainer.nativeElement.style.position = 'absolute';
    this.localMediaContainer.nativeElement.style.top = '50px';
    this.localMediaContainer.nativeElement.style.left = '20px';
    this.localMediaContainer.nativeElement.style['z-index'] = '1';
    await this.agoraEngine.publish([this.localVideoTracks]);
    this.localVideoTracks.play(this.localMediaContainer.nativeElement);
    this.videoMode = true;
  }

  async muteVideo(){
    this.localVideoTracks.close();
    await this.agoraEngine.unpublish([this.localVideoTracks]);
    this.videoMode = false;
  }
  async muteAudio(){
    this.audioMode = false;
    this.localAudioTracks.close();
    await this.agoraEngine.unpublish([this.localAudioTracks]);
  }
  async unMuteAudio(){
    this.audioMode = true;
    this.localAudioTracks = await AgoraRTC.createMicrophoneAudioTrack(); 
    await this.agoraEngine.publish([ this.localAudioTracks]);
  }

  callRequest(){
    this.socketService.callRequestToAgent(this.payload);
    this.loading = true;
    this.showButton = false;
  }

  sendVoice(){
    const payload ={
    "userSid" : this.userSid,
    "text": 'text'}
    this.socketService.speechText(this.payload);
    this.loading = true;
    this.showButton = false;
  }

  async sendMessage(){
    if( this.message && this.message != ''){
      const payload ={
        "roomName":this.userSid,
        "msg":this.message
      }
      this.socketService.sendMessage(payload)
      this.messages.push({
        "message":this.message
      })
      this.scrollToBottom();
      this.message = '';
    }
  }
  removeParticipant(){
    this.socketService.callDicconnected(this.userSid)
    this.agoraEngine.leave();
    this.users = [];
    this.chatButton = false;
  }
  scrollToBottom(): void {
    try {
      this.scrollBottom.nativeElement.scrollTop = this.scrollBottom.nativeElement.scrollHeight + 400;
    } catch(err) { }                 
  }
  timer() {
    // let minute = 1;
    let seconds: number = 60;
    this.timerInterval = setInterval(() => {
      seconds--;
      if (seconds == 0) {
        clearInterval(this.timerInterval);
        if(this.loading){
          this.toastr.error('No agents availble right now please try again in a while')
          this.loading = false;
          this.showButton = true;
        }
      }
    }, 1000);
  }
}