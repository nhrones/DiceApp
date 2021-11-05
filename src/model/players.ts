/** (1) to see all console.log messages 
 *  (0) to prevent all messages */
let DEBUG = (0) ? true : false

import { Player } from '../types.js'
import { events, topic } from '../framework/model/events.js'
import { webSocket, socketTopic } from '../framework/model/socket.js'
import { DiceGame } from './diceGame.js'

/**
 * Players viewModel class
 * manages 1 to 4 player entities and their views
 */
export class Players {

    game: DiceGame
    color: string
    players: Map<string, Player>;

    constructor(game: DiceGame, color: string) {

        this.game = game
        this.color = color

        /** an array of player 'state' objects */
        this.players = new Map();
        this.players.clear()
        thisPlayer = {
            id: "0",
            idx: 0,
            playerName: 'Nick',
            color: 'brown',
            score: 0,
            lastScore: ''
        }
        this.players.set(thisPlayer.id,
            {
                id: thisPlayer.id,
                idx: thisPlayer.idx,
                playerName: thisPlayer.playerName,
                color: '#800000',
                score: 0,
                lastScore: ''
            }
        )

        webSocket.when(socketTopic.UpdatePlayers, (playersArray: Player[]) => {
            // clear the state
            this.players.clear()
            // clear the view
            this.resetScoreLabels()
            // refresh the state and the view
            playersArray.forEach((newPlayer, index) => {
                this.players.set(newPlayer.id,
                    {
                        id: newPlayer.id,
                        idx: index,
                        playerName: newPlayer.playerName,
                        color: newPlayer.color,
                        score: 0,
                        lastScore: ""
                    }
                )
                // needed to refresh name and title
                if (thisPlayer.id === newPlayer.id) {
                    setThisPlayer(newPlayer)
                }
                this.updatePlayer(newPlayer.idx, newPlayer.color, newPlayer.playerName)
            })
            setCurrentPlayer(this.fromIndex(0))
            this.game.resetGame(0)
        })
    }

    /** adds a player to the players array */
    add(player: Player) {
        this.players.set(player.id, player)
    }

    /** returns a Player from the players array based on an index value */
    fromIndex(index: number): Player {
        let p = thisPlayer
        this.players.forEach(player => {
            if (player.idx == index) {
                p = player
            }
        })
        return p
    }

    /** returns the index of a player based on its ID string value */
    indexFromId(id: string): number {
        let i = 0
        this.players.forEach(player => {
            if (player.id === id) return i
            i++
        })
        return 0
    }

    /** resets all players labels */
    resetScoreLabels() {
        for (let i = 0; i < 4; i++) {
            this.updatePlayer(i, this.color, '')
        }
    }

    /** reset players state to initial game state */
    resetPlayers() {
        this.players.forEach(player => {
            player.score = 0
            this.updatePlayer(player.idx, player.color, player.playerName)
        })
    }

    /** add a score value for this player */
    addScore(player: Player, value: number) {
        player.score += value
        let text = (player.score === 0) ? player.playerName : `${player.playerName} = ${player.score}`
        this.updatePlayer(player.idx, player.color, text)
    }

    /** broadcast an update message to the view element */
    updatePlayer(index: number, color: string, text: string) {
        events.broadcast(
            `${topic.UpdateLabel}player${index}`,
            {
                color: this.color,
                textColor: color, text: text
            }
        )
    }
}

 export let thisPlayer: Player = { 
    id: "0",
    idx: 0,
    playerName: 'Nick',
    color: 'brown',
    score: 0,
    lastScore: ''
}

export let quitMsg: string

export function setThisPlayer(player: Player) {
    const favicon = document.getElementById("favicon") as HTMLLinkElement
    thisPlayer = player
    quitMsg = JSON.stringify({ userID: player.id, channel: 'cmd', topic: 'quit', payload: {} })
    document.title = thisPlayer.playerName
    favicon.href = `./icons/${player.idx}.png`;
}

export let currentPlayer: Player = {
    id: "0",
    idx: 0,
    playerName: "Nick",
    color: 'brown',
    score: 0,
    lastScore: ''
}

export function setCurrentPlayer(player: Player) {
    currentPlayer = player
}