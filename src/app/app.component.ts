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
  @ViewChild ('fullScreenContainer') fullScreenContainer:any;
  
  
  @ViewChild('scrollBottom') scrollBottom: any;
  @ViewChild(ToastContainerDirective, { static: true })
  callPicked = 0;
  toastContainer: any;
  agoraClient:any;
  screenMode= false;
  fullScreenMode = false;
  agentName:any;
  live=false;
  contHeigth:any;
  agentImage:any = "url('../assets/background.png')";
  avatar:any = "https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg";
  options = {
    appId: "10cd14249e254391817d2b2ee69ae4ff",  // set your appid here
    channel: UUID.UUID(), // Set the channel name.
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
  localUser = '';
  randomUsers = ['Angelicks', 'Animeis','Bristleco','ChosenSan','Comarq','Comicomit','CommentGravity','Cornymo','Dazzler']
  screenElement:any;
  videoToken:any;
  visibleCheck = false;
  userName:any;
  roomName:any;
  message:any;
  users:any[] =[];
  showButton = false;
  userIndex:any[] = []
  messages:any[]=[];
  videoMode = false;
  audioMode = false;
  chatButton = false;
  showIcons = false;
  title = 'agent-ui';
  public loading = false;
  public videoPublished = false;
  public audioPublished = false;
  UserlocalVideoTrack:any;
  timerInterval: any;
  payload:any;
  agoraEngine:any
  ngOnInit(): void {
    (this.el.nativeElement as HTMLElement).style.setProperty('--vh', window.innerHeight.toString()+"px");
    this.toastr.overlayContainer = this.toastContainer;
    // this.twilioService.getAgentImage().subscribe((doc:any) => {
    //   this.agentImage = doc.img;
    // });
    this.localUser = this.randomUsers[Math.floor(Math.random() * 8)]
  }

  getAccessToken(){
    this.chatButton = true;
    this.loading = true;
    this.showIcons = false;
    this.roomName = UUID.UUID();
    this.options.uid = Math.floor((Math.random() * 1000) + 1);
    this.options.channel = UUID.UUID();
    this.twilioService.getAgoraToken(this.options.uid, this.options.channel).subscribe((data:any)=>{
      this.options.token = data.tokenA;
      this.initAgoraClient();
      this.service.init(this.localParticipant)
    })
  }

  callRequest(){
    this.timer();
    this.socketService.callRequestToAgent(this.payload);
    this.loading = true;
    this.showButton = false;
    this.showIcons = false;
  }

  async initSocket(){
    this.callPicked = 0;
    await this.socketService.initSocket();
    await this.socketService.getSocketConnection().subscribe((doc:any) => {
      if(doc && doc != this.localParticipant){
        this.localParticipant = doc;
        this.getAccessToken()
      }
    });
    this.socketService.getStartScreenShare().subscribe((doc:any) => {
      if(doc){
        this.screenMode = true;
        console.log('called')
        this.visibleCheck = true;
        this.screenElement = doc;
      }
    });

    this.socketService.getStopScreenShare().subscribe((doc:any) => {
      if(doc)
      {
        this.visibleCheck = false;
        this.screenMode = false;
        this.fullScreenMode  = false;
        console.log('called')
        this.agentsCalls()
      }
    });

    this.socketService.getCallRequestAccepted().subscribe((doc:any) => {
      if(doc){
        this.loading = false;
        this.showIcons = true;
        this.live =true;
        this.showButton = false;
        
        console.log("Agent Added called", this.userIndex);
        if(this.userIndex.indexOf(doc.videoUid) === -1) {
          this.userIndex.push(doc.videoUid);
        }
        if(doc.avatar && doc.avatar != ""){
          this.avatar = doc.avatar;
        }
        this.agentImage = doc.image;
        if(this.callPicked == 0){
          this.socketService.userCallAccept(doc);
          this.agentName = doc.agentName
          this.userSid = doc.userUid;
        }
        this.callPicked ++
      }
    });

    this.socketService.getAgentTransferCallEstablished().subscribe((doc:any) => {
      if(doc)
      {
        console.log('getAgentTransferCallEstablished called',doc)
        if(!this.userIndex.find(doc.videoUid)){
          this.userIndex.push(doc.videoUid);
        }
      }
    })

    this.socketService.getMessageReceived().subscribe((doc:any) => {
      if(doc){
        const payload ={
          'message':doc.message,
          'agentName':doc.agentName? doc.agentName:'Test'
        }
        if(this.messages.length > 0 && this.messages[this.messages.length-1].message == doc.message){
          
        }
        else{
          this.messages.push(payload)
          this.scrollToBottom();
        }
      }
    });

    this.socketService.getAgentDisconnected().subscribe((doc:any) => {
      if(doc){
        console.log('called',this.userIndex)
        this.userIndex = this.userIndex.filter(x=> x != parseInt(doc.uid));
        console.log('called',doc,this.userIndex)
        this.agentsCalls();
        this.toastr.success('Call disconnected or agent leaved')
        if(this.userIndex.length == 0){
          this.removeParticipant();
        }
      }
    });

  }


  async initAgoraClient(){
    this.agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    console.log(this.options)
    await this.agoraEngine.join(this.options.appId, this.options.channel,this.options.token, this.options.uid); 
    
    this.payload ={
      userSid: this.localParticipant,
      channelName: this.options.channel,
      conversationSID: ''
    }
    this.timer();
    console.log("called --- 346",this.payload)
    this.socketService.callRequestToAgent(this.payload);
    this.agoraEngine.on("user-published", async (user:any, mediaType:any) =>
    {
      
      console.log("Publich Called",user, mediaType);
      await this.agoraEngine.subscribe(user, mediaType);
      if (mediaType === "video") {
        if(user._videoTrack){
          const uid = (parseInt(user.uid))-1;
          const find = this.userIndex.findIndex(x=>x == uid)
          console.log('User Added', find)
          this.users.push(user)
          if(find == -1)
          {
            console.log("Call Started");
            this.agentsCalls();
          }
          else{
            console.log("Screen Share Started");
            this.screenShare();
          }
        }
      }
      if (mediaType == "audio")
      {
        var audio = user.audioTrack;
        audio.play();
      }
    });
    this.agoraEngine.on("user-unpublished", async (user:any, mediaType:any) =>
    {
      console.log('UnPublich Called', user, mediaType)
      //this.users = this.users.filter(x=> x != user);
    }); 
    
  }

  agentsCalls(){
    console.log('264',this.userIndex.length)
    if(this.userIndex.length == 1){
      const userIndex = this.users.findIndex(x=>x.uid == this.userIndex[0])
      this.remoteMediaContainer1.nativeElement.style.width = "100%";
      this.remoteMediaContainer1.nativeElement.style.height = "100%";
      this.remoteMediaContainer1.nativeElement.style.position = 'absolute';
      this.remoteMediaContainer1.nativeElement.style.left = '0px';
      this.users[userIndex].videoTrack.play(this.remoteMediaContainer1.nativeElement);
      this.remoteMediaContainer1.nativeElement.style.visibility = "visible"
    }
    else if(this.userIndex.length == 2){
      
      const userIndex1 = this.users.findIndex(x=>x.uid == this.userIndex[0]);
      const userIndex2 = this.users.findIndex(x=>x.uid == this.userIndex[1]);
      console.log(userIndex1,userIndex2)
      if(userIndex1>=0 && !this.screenMode){
        this.remoteMediaContainer1.nativeElement.style.width = "100%";
        this.remoteMediaContainer1.nativeElement.style.height = "50%";
        this.remoteMediaContainer1.nativeElement.style.position = 'absolute';
        this.remoteMediaContainer1.nativeElement.style.left = '0px';
        this.users[userIndex1].videoTrack.play(this.remoteMediaContainer1.nativeElement);
        this.remoteMediaContainer1.nativeElement.style.visibility = "visible"
      }
      if(userIndex2>=0){
        this.remoteScreenContainer.nativeElement.style.height = "50%";
        this.remoteMediaContainer2.nativeElement.style.height = "50%";
        this.remoteMediaContainer2.nativeElement.style.width = "100%";
        this.remoteMediaContainer2.nativeElement.style.position = 'absolute';
        this.remoteMediaContainer2.nativeElement.style.left = '0px';
        this.remoteMediaContainer2.nativeElement.style.top = '50%';
        this.users[userIndex2].videoTrack.play(this.remoteMediaContainer2.nativeElement);
        this.remoteMediaContainer2.nativeElement.style.visibility = "visible";
      }
    }
  }
  

  screenShare(){
    const uid = parseInt(this.screenElement.uid);
    const user = this.users.findIndex(x=>x.uid == uid)
    const videoUid = parseInt(this.screenElement.videoUid);
    const screenIndex = this.userIndex.findIndex(x=>x == videoUid)
    console.log(uid, user, videoUid, screenIndex ,this.userIndex.length)
    if(screenIndex == 0 && this.userIndex.length == 1){
      this.remoteScreenContainer.nativeElement.style.width = "100%";
      this.remoteScreenContainer.nativeElement.style.height = "100%";
      this.remoteScreenContainer.nativeElement.style.position = 'absolute';
      this.remoteScreenContainer.nativeElement.style.top = '0%';
      this.users[user].videoTrack.play(this.remoteScreenContainer.nativeElement);
      this.remoteMediaContainer1.nativeElement.style.visibility = "hidden"
    }
    else if(screenIndex == 0 && this.userIndex.length == 2){
      this.remoteScreenContainer.nativeElement.style.width = "100%";
      this.remoteScreenContainer.nativeElement.style.height = "50%";
      this.remoteScreenContainer.nativeElement.style.position = 'absolute';
      this.remoteScreenContainer.nativeElement.style.top = '0%';
      this.users[user].videoTrack.play(this.remoteScreenContainer.nativeElement);
      this.remoteMediaContainer1.nativeElement.style.visibility = "hidden"
    }
    else{
      this.remoteScreenContainer.nativeElement.style.width = "100%";
      this.remoteScreenContainer.nativeElement.style.height = "50%";
      this.remoteScreenContainer.nativeElement.style.position = 'absolute';
      this.remoteScreenContainer.nativeElement.style.top = '50%';
      this.users[user].videoTrack.play(this.remoteScreenContainer.nativeElement);
      this.remoteMediaContainer2.nativeElement.style.visibility = "hidden"
    }
    this.fullScreen();
  }

  fullScreen(){
    this.fullScreenMode  = true;
    const uid = parseInt(this.screenElement.uid);
    const user = this.users.findIndex(x=>x.uid == uid)
    this.fullScreenContainer.nativeElement.style.width = "100%";
    this.fullScreenContainer.nativeElement.style.height = "100%";
    this.fullScreenContainer.nativeElement.style.position = 'absolute';
    
    console.log(uid,user,this.users)
    this.users[user].videoTrack.play(this.fullScreenContainer.nativeElement);
  }

  minScreen(){
    this.fullScreenMode  = false;
    this.screenShare();
  }

  removeScreen(){
    this.fullScreenMode  = false;
    this.screenMode = false;
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
    debugger;
    this.service.stop();
    this.audioMode = false;
    this.localAudioTracks.setMuted(true)
  }
  async unMuteAudio() {
    debugger;
    this.service.start();
    this.audioMode = true;

    const config = {
      audioProfile: 'audio-processing'
    };
    
    // Set the audio profile configuration
    this.agoraEngine.setClientRole(config);
    
    if (!this.localAudioTracks) {
      try {
        this.localAudioTracks = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: false,
          AGC: false,
          ANS: false
        });
        this.agoraEngine.publish(this.localAudioTracks, () => {
          console.log("Audio track published successfully");
        });
      } catch (error) {
        console.error("Failed to create and publish the local audio track:", error);
      }
    } else {
      try {
        await this.localAudioTracks.setMuted(false);
        console.log("Local audio track unmuted.");
      } catch (error) {
        console.error("Failed to unmute the local audio track:", error);
      }
    }
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
        "roomName":this.localParticipant,
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

  async removeParticipant(){
    this.service.stop();
    if(this.localAudioTracks){
      this.localAudioTracks.close();
      await this.agoraEngine.publish([ this.localAudioTracks]);
      this.localAudioTracks = null;
    }
    this.audioMode = false;
    this.agoraEngine.leave();
    this.users = [];
    this.messages = [];
    this.userIndex = [];
    this.live = false;
    this.chatButton = false;
    this.showButton = false;
    this.socketService.callDicconnected(this.userSid)
  }

  close(){
    this.chatButton = false;
    this.service.stop();
    this.agoraEngine.leave();
    this.showButton = false;
    this.audioMode = false;
    this.users = [];
    this.messages = [];
    this.userIndex = [];
    this.live = false;
    clearInterval(this.timerInterval);
    this.socketService.callCancelled(this.userSid)
  }

  scrollToBottom(): void {
    setTimeout(()=>{
      try {
        this.scrollBottom.nativeElement.scrollTop = this.scrollBottom.nativeElement.scrollHeight + 400;
      } catch(err) { }
    },2000)                 
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

  makeid() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 15) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }
}