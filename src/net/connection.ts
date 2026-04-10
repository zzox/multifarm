// import game.conn.Rtc;
// import game.conn.Vs;
// import game.conn.Ws;
// import game.data.State;
// import game.rollback.FrameInput;
// import game.util.Logger;
// import haxe.Timer;
// import js.html.rtc.IceCandidate;
// import js.html.rtc.SessionDescriptionInit;

import { logger } from '../util/logger';
import { average } from '../util/utils';
import { Rtc } from './rtc'
import { Ws } from './ws'

const PING_ITEMS = 20;
const PING_INTERVAL = 250;

// connect to local version
const WS_URL = 'ws://localhost:6969';
const HTTPS_URL = 'https://localhost:6969';

// connect to ngrok from from localhost (ws:// only)
// const WS_URL = 'ws://cf2c-2605-a601-ab03-5e00-c97-839c-cc39-31f6.ngrok.io';

// connect to heroku
// const WS_URL = 'wss://pacepd25-e2ef41da108c.herokuapp.com/';
// const HTTPS_URL = 'https://pacepd25-e2ef41da108c.herokuapp.com/';

type RemoteInput = any

export class Connection {
    static inst:Conn;

    static init () {
        if (Connection.inst == null) {
            Connection.inst = new Conn();
        }

        Connection.inst.init(
            () => {},
            () => {},
            () => {},
            (s:string) => {},
            (r:RemoteInput) => {}
        );
    }
}

enum SocketConnectionState {
    Offline = 'sc-offline',
    Connecting = 'sc-connecting',
    Connected = 'sc-connected',
}

enum PeerConnectionState {
    Offline = 'pc-offline',
    Connecting = 'pc-connecting',
    Connected = 'pc-connected',
}

const SCS = SocketConnectionState
const PCS = PeerConnectionState

class Conn {
    ws!:Ws
    rtc!:Rtc
    // vs?:Vs

    /** server stuff **/
    socketConnectState:SocketConnectionState = SCS.Offline;
    onServerConnect!:() => void;
    onServerDisconnect!:() => void;

    /** p2p stuff **/
    isHost!:boolean;
    peerConnectState:PeerConnectionState = PCS.Offline
    onPeerConnect!:() => void;
    onPeerDisconnect!:(msg:string) => void;

    /** connection stuff **/
    roomId?:string
    onRemoteInput!:(r:RemoteInput) => void;

    /** vs stuff **/
    // onVsEvent:VsEvent => void;

    pingTime!:number;
    pingTimes:number[] = new Array(PING_ITEMS)
    lastPingTime!:number;

    init (
        onServerConnect:() => void,
        onServerDisconnect:() => void,
        onPeerConnect:() => void,
        onPeerDisconnect:(msg:string) => void,
        onRemoteInput:(r:RemoteInput) => void
    ) {
        if (this.socketConnectState !== SCS.Offline || this.peerConnectState !== PCS.Offline) {
            logger.info('connection already exists!');
            return;
        }

        this.onServerConnect = onServerConnect;
        this.onServerDisconnect = onServerDisconnect;
        this.onPeerConnect = onPeerConnect;
        this.onPeerDisconnect = onPeerDisconnect;
        this.onRemoteInput = onRemoteInput;

        this.ws = new Ws(
            WS_URL,
            () => {
                this.socketConnectState = SCS.Connected;
                this.onServerConnect();
            },
            () => {
                this.socketConnectState = SCS.Offline;
                this.onServerDisconnect();
            },
            this.handleWebsocketMessage.bind(this)
        );
    }

    addListeners (
        onServerConnect?:() => void,
        onServerDisconnect?:() => void,
        onPeerConnect?:() => void,
        onPeerDisconnect?:(msg:string) => void,
        onRemoteInput?:(r:RemoteInput) => void,
        // ?onVsEvent:VsEvent => void
    ) {
        if (onServerConnect) this.onServerConnect = onServerConnect;
        if (onServerDisconnect) this.onServerDisconnect = onServerDisconnect;
        if (onPeerConnect) this.onPeerConnect = onPeerConnect;
        if (onPeerDisconnect) this.onPeerDisconnect = onPeerDisconnect;
        if (onRemoteInput) this.onRemoteInput = onRemoteInput;
        // if (onVsEvent) this.onVsEvent = onVsEvent;
    }

    sendInput (index:number, input:number, gameId:number) {
        this.rtc.sendMessage('remote-input', { gameId: gameId, index: index, input: input });
    }

    handlePeerMessage = (message:any) => {
        const type = message.type;
        const payload = message.payload;

        switch (type) {
            case 'ping':
                this.rtc.sendMessage('pong');
                break
            case 'pong':
                this.pingTimes.push(Math.round((Date.now() - this.lastPingTime) * 1000));
                this.pingTimes.shift();
                this.pingTime = Math.round(average(this.pingTimes));
                break
            case 'confirm':
                if (this.peerConnectState == PCS.Connecting) {
                    this.rtc.sendMessage('confirm-ack');
                    this.peerConnectState = PCS.Connected;
                    this.handlePeerConnect();
                } else {
                    throw 'confirm while not connecting';
                }
                break
            case 'confirm-ack':
                if (this.peerConnectState == PCS.Connecting) {
                    this.peerConnectState = PCS.Connected;
                    this.handlePeerConnect();
                }
                break
            case 'remote-input':
                this.onRemoteInput({ index: payload.index, input: payload.input, gameId: payload.gameId });
            // case 'start-ready':
            //     vs.waitingForStart = true;
            //     onVsEvent(StartReady);
            // case 'next-ready':
            //     vs.waitingForNext = true;
            //     onVsEvent(NextReady);
            // case 'leaving':
            //     onVsEvent(Leaving);
            // case 'opp-username':
            //     vs.opusername = payload.username;
                break
            default:
                logger.debug('unhandled peer message', type, payload);
        }
    }

    startPing () {
        // const timer = new Timer(PING_INTERVAL);
        let intervalNum = 0
        intervalNum = setInterval(() => {
            if (!this.rtc) {
                // timer.stop();
                clearInterval(intervalNum)
                return;
            }

            // WARN: not a fan of how this is done, but this ping is started
            // when the data channel is started, confirming the connection.
            // This isn't really necessary because we know the connection is working
            // when the data channel is opened.
            if (this.isHost && this.peerConnectState == PCS.Connecting) {
                this.rtc.sendMessage('confirm')
            }
            this.lastPingTime = Date.now()
            this.rtc.sendMessage('ping')
        }, PING_INTERVAL)
    }

    // for old project
    // sendTimes (times:number[]) {
    //     this.sendWsMessage('room-times', { roomId: this.roomId, times: times });
    // }

    joinOrCreateRoom () {
        if (this.roomId == null) {
            this.createRtcConnection()
            this.sendWsMessage('join-or-create')
        } else {
            logger.error('already in room')
        }
    }

    leaveRoom () {
        // assume we successfully leave
        this.roomId = undefined;
        this.rtc.disconnect();
        // this.rtc = undefined;
        this.peerConnectState = PCS.Offline
        this.sendWsMessage('leave-room')
        // this.vs = null;
        // this.onVsEvent = null;
    }

    sendWsMessage (type:string, payload?:unknown) {
        if (this.socketConnectState != SCS.Connected) {
            logger.error('not connected');
            return;
        }

        if (!this.ws) {
            logger.error('Websocket not initialized');
            return;
        }

        this.ws.send({ type: type, payload: payload });
    }

    handlePeerConnect () {
        this.onPeerConnect()
        // this.vs = new Vs();
        // rtc.sendMessage('opp-username', { username: State.username });
    }

    // sendVsEvent (event:VsEvent) {
    //     switch (event) {
    //         case (StartReady):
    //             rtc.sendMessage('start-ready');
    //         case (NextReady):
    //             rtc.sendMessage('next-ready');
    //         case (Leaving):
    //             rtc.sendMessage('leaving');
    //     }
    // }

    handleWebsocketMessage (message:any) {
        const payload = message.payload;
        const type:string = message.type;
        switch (type) {
            // We created a room and are the host of it.
            case 'room-created':
                logger.log('room created');
                this.isHost = true;
                this.roomId = payload;
                this.rtc.createDataChannel();
                break
            // we created a room and a peer joined.
            case 'peer-joined':
                logger.log('sending offer')
                this.peerConnectState = PCS.Connecting
                this.rtc.createOffer(this.onOfferGenerated)
                break
            // we joined as a peer
            case 'joined-room':
                this.isHost = false;
                this.roomId = payload;
                break
            case 'sdp-offer':
                logger.log('got offer');
                logger.debug('offer', payload);
                this.peerConnectState = PCS.Connecting;
                this.rtc.setRemoteDescription(payload, this.onAnswerGenerated)
                break
            case 'sdp-answer':
                logger.log('got answer');
                logger.debug('answer', payload);
                this.rtc.setAnswer(payload);
                break
            case 'ice-candidate':
                logger.debug('got candidate', payload);
                this.rtc.addIceCandidate(payload);
                break
            default:
                logger.debug('unhandled message', type, payload);
        }
    }

    createRtcConnection () {
        this.rtc = new Rtc(
            this.handleIceCandidate,
            this.handlePeerMessage,
            () => {
                this.startPing();
                this.onPeerConnect();
            },
            () => {
                this.peerConnectState = PCS.Offline;
                this.onPeerDisconnect('datachannel closed');
            }
        );
    }

    onOfferGenerated = (offer:RTCSessionDescriptionInit) => {
        this.sendWsMessage('sdp-offer', { roomId: this.roomId, offer: offer });
    }

    onAnswerGenerated = (answer:RTCSessionDescriptionInit) => {
        this.sendWsMessage('sdp-answer', { roomId: this.roomId, answer:answer });
    }

    handleIceCandidate = (candidate:RTCIceCandidate) => {
        this.sendWsMessage('ice-candidate', { roomId: this.roomId, candidate: candidate });
    }

    createRoom () {
        throw 'Dont use this.';
        if (this.roomId == null) {
            // MAYBE: a joiningRoom var, OR a ConnectionStatus enum
            this.sendWsMessage('create-room');
        } else {
            logger.error('already in room');
        }
    }

    joinAnyRoom () {
        throw 'Dont use this.';
        if (this.roomId == null) {
            // MAYBE: a joiningRoom var, OR a ConnectionStatus enum
            this.sendWsMessage('join-any-room');
        } else {
            logger.error('already in room');
        }
    }
}
