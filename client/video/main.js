var rtc = RTC({
  signaller: 'http://192.168.2.115:9323',
  constraints: {
    video: true,
    audio: false
  },
  room: 'jsconf',
  localContainer: '#l-video',
  remoteContainer: null
});
