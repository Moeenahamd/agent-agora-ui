import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { TwilioService } from './services/twilio.service';
import { Client } from '@twilio/conversations';
import * as Video from 'twilio-video';
import { UUID } from 'angular2-uuid';
import { SocketService } from './services/socket.service';
import AgoraRTC, { IAgoraRTCClient, LiveStreamingTranscodingConfig, ICameraVideoTrack, IMicrophoneAudioTrack, ScreenVideoTrackInitConfig, VideoEncoderConfiguration, AREAS, IRemoteAudioTrack, ClientRole } from "agora-rtc-sdk-ng"

import { 
  connect,
  createLocalVideoTrack,
  createLocalAudioTrack,
  RemoteAudioTrack, 
  RemoteParticipant, 
  RemoteTrack, 
  RemoteVideoTrack,
  Room
} from 'twilio-video';
import { ToastContainerDirective, ToastrService } from 'ngx-toastr';


const joinButton = document.querySelector('#join-button') as HTMLButtonElement;
const remoteMediaContainer = document.querySelector('#remote-media-container') as HTMLDivElement;
//const localMediaContainer = document.querySelector('#local-media-container') as HTMLDivElement;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild ('localMediaContainer') localMediaContainer:any;
  @ViewChild ('remoteMediaContainer') remoteMediaContainer:any;
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
    private renderer: Renderer2,
    private toastr: ToastrService,
    private el:ElementRef) { }
  ngOnInit(): void {
    (this.el.nativeElement as HTMLElement).style.setProperty('--vh', window.innerHeight.toString()+"px");
    this.toastr.overlayContainer = this.toastContainer;
    this.socketService.connectSocket()
    this.socketService.CallRequestAccepted.subscribe((doc:any) => {
      this.loading = false;
      this.agentName = doc.agentName
      this.userSid = doc.userSid;
      if(doc.avatar && doc.avatar != ""){
        this.avatar = doc.avatar;
      }
      this.agentImage = doc.image;
      this.socketService.userCallAccept(doc);
      this.onJoinClick()
    });
    this.twilioService.getAgentImage().subscribe((doc:any) => {
      this.agentImage = doc.img;
    });
    this.socketService.messageReceived.subscribe((doc:any) => {
      const payload ={
        'msg':doc.msg,
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
  conversationToken:any;
  conversationClient:any;
  localParticipant:any;
  conversation:any;
  room:any;
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

  scrollToBottom(): void {
    try {
      this.scrollBottom.nativeElement.scrollTop = this.scrollBottom.nativeElement.scrollHeight + 400;
      console.log(
        this.scrollBottom.nativeElement.scrollTop = this.scrollBottom.nativeElement.scrollHeight,this.scrollBottom.nativeElement.scrollHeight + 400)
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
  payload:any;
  async initAgoraClient(){
    const agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    await agoraEngine.join(this.options.appId, this.options.channel,this.options.token, this.options.uid); 
    agoraEngine.on("user-published", async (user:any, mediaType:any) =>
    {
      this.screenMode = true;
        await agoraEngine.subscribe(user, mediaType);
        if (mediaType === "video") {
          const remoteVideoTrack = user.videoTrack;
          
          this.remoteScreenContainer.nativeElement.style.width = "100%";
          this.remoteScreenContainer.nativeElement.style.height = "50%";
          this.remoteScreenContainer.nativeElement.style.position = 'absolute';
          this.remoteScreenContainer.nativeElement.style.left = '0px';
          remoteVideoTrack.play(this.remoteScreenContainer.nativeElement);
        }
        console.log("subscribe success",user, mediaType);
    });
    agoraEngine.on("user-unpublished", async (user:any, mediaType:any) =>
    {
      this.screenMode = false;
    });  
  }
  getAccessToken(){
    this.chatButton = true;
    //this.loading = true;
    this.roomName = UUID.UUID()
    const socketObj=this.socketService.getSocket();
    this.localParticipant = socketObj.ioSocket.id;
    
    this.twilioService.getAgoraToken(this.options.uid).subscribe((data:any)=>{
      this.options.channel = data.channelName;
      this.options.token = data.token;
      this.initAgoraClient();

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
      this.initChatClient();
      this.onJoinClick();
      this.socketService.callRequest(this.payload);
    })
  }

  callRequest(){
    this.socketService.callRequest(this.payload);
    this.loading = true;
    this.showButton = false;
  }

  async initChatClient(){
    this.conversationClient = await new Client(this.conversationToken);
  }

  async sendMessage(){
    if( this.message && this.message != ''){
      const payload ={
        "roomName":this.userSid,
        "msg":this.message
      }
      this.socketService.userSendMessage(payload)
      this.messages.push({
        "msg":this.message
      })
      this.scrollToBottom();
      this.message = '';
    }
  }
  




  manageTracksForRemoteParticipant(participant: RemoteParticipant) {
    // Handle tracks that this participant has already published.
    this.attachAttachableTracksForRemoteParticipant(participant);

    // Handles tracks that this participant eventually publishes.
    participant.on('trackSubscribed', this.onTrackSubscribed);
    participant.on('trackUnsubscribed', this.onTrackUnsubscribed);
  }

  attachAttachableTracksForRemoteParticipant(participant: RemoteParticipant) {
    participant.tracks.forEach((publication:any) => {
        if (!publication.isSubscribed)
            return;

        if (!this.trackExistsAndIsAttachable(publication.track))
            return;

        this.attachTrack(publication.track);
    });
  }

  onTrackSubscribed(track: RemoteTrack) {
    if (!this.trackExistsAndIsAttachable(track))
        return;

    this.attachTrack(track);
  }
  attachTrack(track: RemoteAudioTrack | RemoteVideoTrack, participant?:any) {
    const videoElement = track.attach();
    this.renderer.setStyle(videoElement, 'height', '100%');
    this.renderer.setStyle(videoElement, 'width', '100%');
    this.renderer.setStyle(videoElement, 'position', 'absolute');
    this.renderer.setStyle(videoElement, 'object-fit', 'cover');
    this.renderer.setStyle(videoElement, 'z-index', '0');
    this.renderer.setStyle(videoElement, 'left', '0px');
    this.renderer.appendChild(this.remoteMediaContainer.nativeElement, videoElement);
    this.videos.push({
      agentName:this.agentName,
      participant:participant,
      video:videoElement
    })
    if(this.remoteMediaContainer.nativeElement.childNodes.length == 4){
      this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[0], 'height', '50%');
      this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[1], 'height', '50%');
      this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[2], 'height', '50%');
      this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[3], 'height', '50%');
      this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[2], 'top', '50%');
      this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[3], 'top', '50%');
    }
  }
  onTrackUnsubscribed(track: RemoteTrack) {
    console.log("participantLeave")
    if (this.trackExistsAndIsAttachable(track))
        track.detach().forEach(element => element.remove());
  }

  trackExistsAndIsAttachable(track?: any): track is RemoteAudioTrack | RemoteVideoTrack {
    return !!track && (
        (track as RemoteAudioTrack).attach !== undefined ||
        (track as RemoteVideoTrack).attach !== undefined
    );
  }

  async onJoinClick() {
     await connect(this.videoToken, {
        name: this.roomName,
        audio: false,
        video: false
    }).then(room => {
      console.log(`Successfully joined a Room: ${room.localParticipant}`);
      this.room = room;
      console.log(this.room);

      room.participants.forEach(
        participant => this.manageTracksForRemoteParticipant(participant)
      );
      this.room.on('disconnected', (room:any) => {
        room.localParticipant.tracks.forEach((publication:any) => {
          const attachedElements = publication.track.detach();
          attachedElements.forEach((element:any) => element.remove());
        });
      });
    
      this.room.on('participantConnected', (participant:any) => {
        //this.loading = false;
        console.log(`A remote Participant connected: ${participant}`, participant.tracks);
        this.toastr.success('Agent received the call ')
        this.agentCount++
        participant.tracks.forEach((publication:any) => {
          if (publication.isSubscribed) {
            const track:any = publication.track;
            this.attachTrack(track)
          }
        });

        participant.on('trackSubscribed', (track:any) => {
          console.log("called")
          this.attachTrack(track,participant)
        });
      });
      this.room.on('participantDisconnected', (participant:any) => {
        //this.loading = false;
        this.videos.forEach((element:any)=>{
          if(participant == element.participant){
            this.toastr.error('Agent Disconnected or Left')
            this.remoteMediaContainer.nativeElement.removeChild(element.video)
            if(this.remoteMediaContainer.nativeElement.childNodes.length == 2){
              this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[0], 'height', '100%');
              this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[0], 'top', '0px');
              this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[1], 'height', '100%');
              this.renderer.setStyle(this.remoteMediaContainer.nativeElement.childNodes[1], 'top', '0px');
            }
            else if(this.remoteMediaContainer.nativeElement.childNodes.length == 0){
              this.removeParticipant();
            }
          }
          else{
            this.agentName = element.agentName;
          }
        })
      });
    }, error => {
      console.error(`Unable to connect to Room: ${error.message}`);
    });
  }
  videoElement:any
  async localVideoTrack(localVideoTrack:any) {
    // Provides a camera preview window.
    
    this.videoElement = localVideoTrack.attach();
    this.renderer.setStyle(this.videoElement, 'height', '115px');
    this.renderer.setStyle(this.videoElement, 'width', '115px');
    this.renderer.setStyle(this.videoElement, 'position', 'absolute');
    this.renderer.setStyle(this.videoElement, 'left', '20px');
    this.renderer.setStyle(this.videoElement, 'top', '40px');
    this.renderer.setStyle(this.videoElement, 'z-index', '1');
    this.renderer.appendChild(this.localMediaContainer.nativeElement, this.videoElement)
  }

  muteVideo(){
    this.videoMode = false;
    this.room.localParticipant.videoTracks.forEach((publication:any) => {
      publication.track.disable();
      publication.unpublish();
    });
    this.renderer.removeChild(this.localMediaContainer.nativeElement, this.videoElement)
  }

  muteAudio(){
    this.audioMode = false;
    this.room.localParticipant.audioTracks.forEach((publication:any) => {
      publication.track.disable();
    });
  }

  async unMuteVideo(){

    this.videoMode = true;
    let localVideoTrack = await createLocalVideoTrack();
    this.localVideoTrack(localVideoTrack);

    if(this.videoPublished === false) {

      console.log("going to publish video")
      this.room.localParticipant.publishTrack(localVideoTrack, {
        priority: 'high'
      })
      this.videoPublished = true;
    }
    else {
      this.room.localParticipant.videoTracks.forEach((track:any) => {
        track.track.enable();
      });
    }
    
  }

  async unMuteAudio(){
    this.audioMode = true;
    
    if(this.audioPublished === false) {
      let localAudioTrack = await createLocalAudioTrack({});
      this.room.localParticipant.publishTrack(localAudioTrack, {
        priority: 'high'
      })
      this.audioPublished = true;
    }
    else {
      this.room.localParticipant.audioTracks.forEach((publication:any) => {
        publication.track.enable();
      });
    }
  }

  removeParticipant(){
    this.socketService.callDicconnected(this.userSid)
    this.room.disconnect();
    this.muteAudio();
    this.muteVideo();
    this.chatButton = false;
  }
}