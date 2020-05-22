console.info(`Amazon Chime SDK Version: ${ChimeSDK.Versioning.sdkVersion}`)

let meetingSession;
let configuration;

let localVideoStarted = false;
let localVideoEnabled = false;

let videoElements = [];

let startButton;
let toggleVideoButton;

const getMeetingInfo = async function(){
  try {
    const meetingName = 'FirefoxTest';
    const region = this.region || 'us-east-1';
    const host = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    const response = await fetch(
      `${host}/join?title=${encodeURIComponent(meetingName)}&name=${encodeURIComponent(`User${Math.floor(Math.random()*100)}`)}&region=${encodeURIComponent(region)}`,
      {
        method: 'POST',
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(error)
  }
}

const startMeeting = async function(){
  
  let joinInfo = (await getMeetingInfo()).JoinInfo;
  let configuration = new ChimeSDK.MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
  console.log(`Meeting: ${joinInfo.Meeting.Meeting.MeetingId}`)
  console.log(`Attendee: ${joinInfo.Attendee.Attendee.AttendeeId}`)
  // configuration.enableWebAudio = true;
  // configuration.enableUnifiedPlanForChromiumBasedBrowsers = true;

  const logger = new ChimeSDK.ConsoleLogger(
    "ChimeMeetingLogs", 
    ChimeSDK.LogLevel.WARN
    // ChimeSDK.LogLevel.INFO
  );

  const deviceController = new ChimeSDK.DefaultDeviceController(logger);
  meetingSession = new ChimeSDK.DefaultMeetingSession(
    configuration,
    logger,
    deviceController
  );

  initUserInterface();

  await initAudioInput();
  await initVideoInput();
  await initAudioOutput();
  await initObserver();

  startButton.style.display = 'block'
}


const initUserInterface = function(){
  // UI event listeners
  startButton = document.getElementById('startButton');
  startButton.addEventListener('click', ()=> {
    meetingSession.audioVideo.start(); 
    startButton.style.display = 'none';
  });

  toggleVideoButton = document.getElementById('toggleVideoButton');
  toggleVideoButton.addEventListener('click', ()=> {
    toggleLocalVideo();
  });

  let tilesElement = document.getElementById('tiles')
  for (let i=0; i<=16; i++){
    let videoElement = document.createElement('video')
    videoElement.id = `video-${i+1}`
    videoElement.setAttribute('autoplay', true)
    videoElements.push(videoElement);
    tilesElement.appendChild(videoElement)
  }
}


const initAudioInput = async function(){
  // Audio Input
  let audioDevices = await meetingSession.audioVideo.listAudioInputDevices();
  if (!audioDevices.length){
    console.error('You need sound devices to run this demo')
  }
  await meetingSession.audioVideo.chooseAudioInputDevice(audioDevices[0]);
}

const initAudioOutput = async function(){
   // Audio Output
  const audioOutputElement = document.getElementById("audioStream");
  await meetingSession.audioVideo.bindAudioElement(audioOutputElement);
}

const initVideoInput = async function(){
  // Video Input
  let videoDevices = await meetingSession.audioVideo.listVideoInputDevices();
  if (!videoDevices.length){
    console.error('You need video devices to run this demo')
  }
  await meetingSession.audioVideo.chooseVideoInputDevice(videoDevices[0]);
}

const startLocalVideo = async function(){
  console.log('Starting video...')
  await meetingSession.audioVideo.startLocalVideoTile();
  toggleVideoButton.style.display = 'block';
  localVideoStarted = true;
  localVideoEnabled = true;
}

const toggleLocalVideo = async function(){
  if (localVideoEnabled){
    await meetingSession.audioVideo.stopLocalVideoTile();
    localVideoEnabled = false;
    console.log('ToggleVideo: OFF');
    toggleVideoButton.textContent = 'Turn Video On'
  } else {
    await initVideoInput();
    await meetingSession.audioVideo.startLocalVideoTile();
    localVideoEnabled = true;
    console.log('ToggleVideo: ON');
    toggleVideoButton.textContent = 'Turn Video Off'
  }
}


const initObserver = function(){
  const observer = {

    audioVideoDidStart: () => {
      console.log('Meeting Started');
    },
    videoAvailabilityDidChange: availability => {
      console.log(`=> videoAvailabilityDidChange`, availability);
      if (availability.canStartLocalVideo && !localVideoStarted) {
        startLocalVideo();
      }
    },
    audioVideoDidStartConnecting: reconnecting => {
      if (reconnecting) {
        console.log('Attempting to reconnect');
      }
    },
    audioVideoDidStop: sessionStatus => {
      // See the "Stopping a session" section for details.
      console.log('Stopped with a session status code: ', sessionStatus.statusCode());
    },
    videoTileDidUpdate: tileState => {
      if (!tileState.boundAttendeeId){
        return;
      }
      console.log('videoTileDidUpdate', tileState.tileId, tileState.boundAttendeeId)
      meetingSession.audioVideo.bindVideoElement(
        tileState.tileId, 
        acquireVideoElement(tileState.tileId)
      );
    },
    videoTileWasRemoved: tileId => {
      console.log('remove tile', tileId);
      releaseVideoElement(tileId)
    },
  }
  meetingSession.audioVideo.addObserver(observer);
}


document.addEventListener('DOMContentLoaded', (event) => {
  startMeeting()
})


