import { logger } from '../util/logger'

export class Ws {
    ws:WebSocket
    isOpen:boolean = false
    onOpenHandler:() => void
    onCloseHandler:() => void
    onMessageHandler:(msg:string) => void

    constructor (
        url:string,
        onOpen:() => void,
        onClose:() => void,
        onMessage:(msg:string) => void
    ) {
        this.onOpenHandler = onOpen;
        this.onCloseHandler = onClose;
        this.onMessageHandler = onMessage;

        this.ws = new WebSocket(url);
        this.ws.onmessage = (message) => {
            const parsed = JSON.parse(message.data)
            logger.debug('websocket message', parsed)
            this.onMessageHandler(parsed)
        }

        this.ws.onopen = () => {
            this.isOpen = true
            this.onOpenHandler()
            console.warn('websocket opened')
        }

        this.ws.onclose = () => {
            this.isOpen = false
            this.onCloseHandler()
            // destroy()
            console.warn('websocket closed')
        }

        this.ws.onerror = (e) => {
            console.error(e)
        }

        setInterval(() => {
            if (this.isOpen) {
                this.send({ type: 'ping', payload: 'hi' })
            }
        }, 25 * 1000)
    }

    send (message:unknown) {
        if (this.isOpen) {
            this.ws.send(JSON.stringify(message));
        } else {
            logger.log('Failed to send message, websocket is closed.');
        }
    }

    // destroy () {
    //     this.onOpenHandler = undefined;
    //     this.onCloseHandler = undefined;
    //     this.onMessageHandler = undefined;
    //     this.ws.onmessage = null;
    //     this.ws.onopen = null;
    //     this.ws.onclose = null;
    //     this.ws.onerror = null;
    //     this.ws.close();
    // }
}
