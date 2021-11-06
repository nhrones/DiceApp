
import { DiceGame } from './model/diceGame.js';
import { Container, container } from './view/container.js'
import { webSocket, socketTopic } from './framework/model/socket.js';
import { setThisPlayer, setCurrentPlayer, thisPlayer } from './model/players.js';

export let DEBUG = 2
export let SERVICE_WORKER = true

// on webSocket.init, the socketServer will 
// issue a new client 'ID'
webSocket.when(socketTopic.SetID, (data: { id: string }) => {
    var name = prompt("Please enter your name", "Bill") || 'Jane';
    thisPlayer.id = data.id
    thisPlayer.playerName = name
    setThisPlayer(thisPlayer)
    setCurrentPlayer(thisPlayer)
    // now that we have a unique ID, 
    // we'll register it with all other peers(clients)
    webSocket.register(data.id, name)
})


// wait for it ...
window.addEventListener('DOMContentLoaded', (e) => {
    
    if (SERVICE_WORKER) {
        navigator.serviceWorker.register('./sw.js').then((registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, (err) => {
            console.log('ServiceWorker registration failed: ', err);
        });
    }
    
    // instantiate a view container
    Container.init(document.getElementById('canvas') as HTMLCanvasElement, 'snow')

    // build the main view-model
    DiceGame.init();

    // reify the UI from elementDescriptors  
    container.hydrateUI()

})