import { SubscriptionObject, } from '../../types.js'
import { events, topic } from '../model/events.js'

/** (1) to see all console.log messages 
 *  (0) to prevent all messages */
let DEBUG = (1) ? true : false

/*
key		callback location
-----------------------------------
SetID		    app.js:5
UpdatePlayers	players.js:17
UpdateDie	    dice.js:32
UpdateRoll	    rollButton.js:13
ResetTurn	    diceGame.js:24
ResetGame	    diceGame.js:30
ShowPopup	    popup.js:30
UpdateScore#	scoreElement.js:31
*/

 
/** A singleton WebSocket Events class  */
class SocketSingleton {

    private topicSubscriptions: Map<string, SubscriptionObject[]> = new Map()

    private static _instance: SocketSingleton

    private constructor() {
        // initialize our event manager
        this.init()
    }

    webSocket: WebSocket | null = null
    isOpen: boolean = false
    openAttempts: number = 0

    // singleton construction and accessor
    static getInstance() {
        if (!SocketSingleton._instance) {
            SocketSingleton._instance = new SocketSingleton()
        }
        return SocketSingleton._instance
    }

    /** Initialize the websocket service with event listeners */
    init() { 
        
        // close the socket when the window closes
        window.onbeforeunload = () => {
            if (this.webSocket) {
                this.webSocket.onclose = function () { }; // disable onclose handler first
                this.webSocket.close()
            }
        };

        // if we're already initialized just return
        if (this.webSocket) { return } 
        
        // instantiate a new WebSocket listener
        let ws = `wss://dice-socket-server.deno.dev/`
        if (window.location.host === '127.0.0.1:8000' || window.location.host === 'localhost:8000') {
            ws = 'ws://127.0.0.1:8080'
        }
        this.webSocket = new WebSocket(ws)
        console.log(`window.location.host: ${window.location.host}`)
        console.log(`connected to: ${ws}`)
        
        // set up a `message` event handler for this connection
        this.webSocket.onmessage = (message: MessageEvent) => {
            console.info(message)
            const d = JSON.parse(message.data)
            if (DEBUG) console.log(`Socket recieved: ${message.data}`)
            this.dispatch(d.topic, d.data)
        }

        // only once at startup
        this.webSocket.onopen = () => {
            this.isOpen = true
            events.broadcast(topic.PopupResetGame, {})
        }
    }

    // called from app.ts line# 15
    register(id: string, name: string) {
        // notify the server ... we will register as a new player
        this.broadcast(
            socketTopic.RegisterPlayer,
            { id: id, name: name }
        )
    }

    /**
     *  (private) dispatches a topic for to all registered listeners with optional data
     *	e.g.: Socket.dispatch("DiceGame-GameOver", winner)
     *	@param topic {string} the topic of interest
     *	@param data {string | object} optional data to report to subscribers
     */
    dispatch(topic: string, data: string | object) {
        if (this.topicSubscriptions.has(topic)) {
            let subscriptions = this.topicSubscriptions.get(topic)!
            if (subscriptions) {
                subscriptions.forEach(function (subscription: SubscriptionObject, index: number) {
                    subscription.callback(data != undefined ? data : {})
                    if (subscription.onlyOnce) {
                        delete subscriptions[index]
                    }
                })
            }
        }
    }

    /**
     *  registers a callback function to be executed 'when' a topic is published
     *	e.g.: Socket.when("DiceGame-GameOver", Game.resetGame)
     *	@param topic {string} the topic of interest
     *	@param listener {function} a callback function
     *  @returns an object containing a 'remove' function
     */
    when(topic: string, listener: Function) {
        if (!this.topicSubscriptions.has(topic)) {
            this.topicSubscriptions.set(topic, [])
        }
        let callbacks = this.topicSubscriptions.get(topic)!
        callbacks.push({ callback: listener, onlyOnce: false })
    }

    /**
     *  sends a message to the socket server to be broadcast to subscriber
     *	@param topic {string} the topic of interest
     *	@param data {string or object} the data object to send
     * */
    broadcast(topic: string, data: object) {
            let msg = JSON.stringify({ topic: topic, data: data })
            if (this.webSocket) {
                this.webSocket.send(msg)
            }

    }
}

/**
 * the exported webSocket singlton object
 */
export const webSocket = SocketSingleton.getInstance()

/**
 * exported socket event topics list
 */
export const socketTopic = {
    RegisterPlayer: 'RegisterPlayer',
    ResetGame: 'ResetGame',
    ResetTurn: 'ResetTurn',
    SetPlayerName: 'SetPlayerName',
    ShowPopup: 'ShowPopup',
    UpdateRoll: 'UpdateRoll',
    UpdateScore: 'UpdateScore',
    UpdateDie: 'UpdateDie',
    UpdatePlayers: 'UpdatePlayers',
    SetID: "SetID"
}