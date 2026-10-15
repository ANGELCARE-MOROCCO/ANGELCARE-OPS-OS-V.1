/** Opus mono speech target, not a guarantee of total wire bandwidth. */
export const hotlineSpeechOptions={
 audioCaptureDefaults:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true},
 publishDefaults:{audioPreset:{maxBitrate:20000},dtx:true,red:true,forceStereo:false,stopMicTrackOnMute:true},
 disconnectOnPageLeave:true,stopLocalTrackOnUnpublish:true,
} as const
