// package game.conn

import { logger } from "../util/logger"

// import game.util.Logger
// import haxe.Json
// import js.html.rtc.DataChannel
// import js.html.rtc.IceCandidate
// import js.html.rtc.PeerConnection
// import js.html.rtc.SessionDescription
// import js.html.rtc.SessionDescriptionInit

export class Rtc {
    pc:RTCPeerConnection
    datachannel?:RTCDataChannel

    onDatachannelMessage:(message:string) => void
    onDatachannelOpened:() => void
    onDatachannelClosed:() => void

    isOpen:boolean = false

    constructor (
        onIceCandidate:(candidate:RTCIceCandidate) => void,
        onDatachannelMessage:(message:string) => void,
        onDatachannelOpened:() => void,
        onDatachannelClosed:() => void
    ) {
        this.pc = new RTCPeerConnection(
            { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        )

        // Not in haxe?
        // pc.onconnectionstatechange = () => {
        //     trace('connectionState: ' +  pc.connectionState)
        // }
    
        this.pc.onsignalingstatechange = (state) => {
            logger.log('signalingState: ' +  this.pc.signalingState)
        }
    
        this.pc.onicecandidate = (data) => {
            if (data.candidate != null) {
                onIceCandidate(data.candidate)
            }
        }

        this.pc.ondatachannel = this.handleDatachannelOpened

        this.onDatachannelMessage = onDatachannelMessage
        this.onDatachannelOpened = onDatachannelOpened
        this.onDatachannelClosed = onDatachannelClosed
    }

    sendMessage (type:String, payload?:unknown) {
        if (this.isOpen) {
            this.datachannel!.send(JSON.stringify({ type: type, payload: payload }))
        } else {
            logger.debug('cannot send message, data channel closed')
        }
    }

    handleDatachannelOpened = (dc?:RTCDataChannelEventInit) => {
        // when called from ondatachannel, we get it from the event
        if (!this.datachannel) {
            this.datachannel = dc!.channel
        }

        logger.log('channel opened')
        this.isOpen = true
        this.datachannel.onmessage = (message) => {
            this.onDatachannelMessage(JSON.parse(message.data))
        }
        this.datachannel.onclose = () => {
            this.isOpen = false
            this.onDatachannelClosed()
        }
        this.onDatachannelOpened()
    }

    createDataChannel () {
        this.datachannel = this.pc.createDataChannel('main', { ordered: true })
        this.datachannel.onopen = () => {
            this.handleDatachannelOpened()
        }
    }

    createOffer (onOfferGenerated:(offer:RTCSessionDescriptionInit) => void) {
        this.pc.createOffer().then((offer:RTCSessionDescriptionInit) => {
            this.pc.setLocalDescription(offer).then((_:void) => {
                onOfferGenerated(offer)
            })
        })
    }

    // following 3 methods can't cast to the types we want so type-checking is
    // done by initializing their type with a dynamic variable.

    // sets a remote description and generates an answer
    setRemoteDescription (
        answer:RTCSessionDescription, onAnswerGenerated: (offer:RTCSessionDescriptionInit) => void
    ) {
        this.pc.setRemoteDescription(new RTCSessionDescription(answer)).then((_:void) => {
            this.pc.createAnswer().then((answer:RTCSessionDescriptionInit) => {
                onAnswerGenerated(answer)
                this.pc.setLocalDescription(answer)
            })
        })
    }

    // sets an answer only
    setAnswer (answer:RTCSessionDescription) {
        this.pc.setRemoteDescription(new RTCSessionDescription(answer))
    }

    // adds and ice candidate
    addIceCandidate (candidate:RTCIceCandidate) {
        this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    }

    disconnect () {
        this.pc.close()
    }
}
