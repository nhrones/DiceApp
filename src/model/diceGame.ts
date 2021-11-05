import { webSocket, socketTopic } from '../framework/model/socket.js';
import { events, topic} from '../framework/model/events.js'
import { Players, currentPlayer, setCurrentPlayer, thisPlayer} from '../model/players.js'

import { Player} from '../types.js'
import PlaySound from '../framework/model/sounds.js'
import Dice from './dice.js'
import Possible from './possible.js'
import ScoreElement from './scoreElement.js'
import RollButton from './rollButton.js'


///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//         local const for faster resolution        \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\

const snowColor = 'snow'
const grayColor = 'gray'

///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//      exported aliases for faster resolution      \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
 
export let game: DiceGame
export let dice: Dice

/** the main view-model for the dice game */
export class DiceGame {
    
    players: Players
    scoreItems: ScoreElement[]
    leftBonus: number
    fiveOkindBonus: number
    leftTotal: number
    rightTotal: number
    rollButton: RollButton

    /** DiceGame private instance, exposed by init() */
    private static _instance: DiceGame

    /** singleton initialization */
    static init() {
        if (!DiceGame._instance) {
            DiceGame._instance = new DiceGame()
            game = DiceGame._instance
        }
    }

    /** private singleton constructor, called from init() */
    private constructor() {
        
        this.players = new Players(this, snowColor)
        this.scoreItems = []
        this.leftBonus = 0
        this.fiveOkindBonus = 0
        this.leftTotal = 0
        this.rightTotal = 0
        dice = Dice.init()
        this.rollButton = new RollButton()
        Possible.init()

        ///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                       bind events                          \\
        ///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        webSocket.when(socketTopic.ResetTurn, (data: { currentPlayerIndex: number }) => {
            if (!this.isGameComplete()) {
                setCurrentPlayer(this.players.fromIndex(data.currentPlayerIndex))
                this.resetTurn()
            }
        })

        webSocket.when(socketTopic.ResetGame, (data: { currentPlayerIndex: number }) => {
            this.resetGame(data.currentPlayerIndex)
        })
        
        
        events.when(topic.PopupResetGame, () => {
            webSocket.broadcast(
                socketTopic.ResetGame, { id: thisPlayer.id }
            )
        })

        events.when(topic.ScoreElementResetTurn, () => {
            if (this.isGameComplete()) {
                this.clearPossibleScores()
                this.setLeftScores()
                this.setRightScores()
                this.showFinalScore(this.getWinner())
            } else if (!this.isGameComplete()) {
                this.resetTurn()
            }
        })

        events.when(topic.ViewWasAdded, (view: { type: string, index: number, name: string }) => {
            if (view.type === 'ScoreButton') {
                this.scoreItems.push(new ScoreElement(view.index, view.name))
            }
        })
    }

    /** check score total and determin the winner of this game */
    getWinner() {
        if (this.players.players.size === 1) {
            return this.players.fromIndex(0)
        }
        let thisWinner = this.players.fromIndex(0)
        let highscore = 0
        this.players.players.forEach((player: Player) => {
            if (player.score > highscore) {
                highscore = player.score
                thisWinner = player
            }
        })
        return thisWinner
    }

    /** clear all scoreElements possible score value */
    clearPossibleScores() {
        this.scoreItems.forEach((thisElement: any) => {
            thisElement.clearPossible()
        })
    }

    /** evaluates the dice and then sets a possible score value for each scoreelements */
    evaluatePossibleScores() {
        this.scoreItems.forEach((thisElement: ScoreElement) => {
            thisElement.setPossible()
        })
    }

    /** resets the turn by resetting values and state */
    resetTurn() {
        this.rollButton.state.color = currentPlayer.color
        this.rollButton.state.enabled = true
        this.rollButton.state.text = 'Roll Dice'
        this.rollButton.update()
        dice.resetTurn()
        this.clearPossibleScores()
        this.setLeftScores()
        this.setRightScores()
    }

    /** resets game state to start a new game */
    resetGame(currentPlayerIndex: any) {
        document.title = thisPlayer.playerName
        events.broadcast(topic.HidePopup, {})
        setCurrentPlayer(this.players.fromIndex(currentPlayerIndex))
        dice.resetGame()
        this.scoreItems.forEach((thisElement: ScoreElement) => {
            thisElement.reset()
        })
        // clear the view
        this.players.resetScoreLabels()
        this.leftBonus = 0
        this.fiveOkindBonus = 0
        this.leftTotal = 0
        this.rightTotal = 0
        events.broadcast(
            topic.UpdateLabel + 'leftscore',
            { state: 0, color: 'gray', textColor: snowColor, text: '^ total = 0' }
        )
        this.players.resetPlayers()
        this.rollButton.state.color = 'brown'
        this.rollButton.state.text = 'Roll Dice'
        this.rollButton.state.enabled = true
        this.rollButton.update()
    }

    /** show a popup with winner and final score */
    showFinalScore(winner: any) {
        let winMsg
        if (winner.id !== thisPlayer.id) {
            PlaySound.Nooo()
            winMsg = winner.playerName + ' wins!'
        }
        else {
            PlaySound.Woohoo()
            winMsg = 'You won!'
        }
        this.rollButton.state.color = 'black'
        this.rollButton.state.text = winMsg
        this.rollButton.update()
        events.broadcast(topic.UpdateLabel + 'infolabel',
            { state: 0, color: 'snow', textColor: 'black', text: winMsg + ' ' + winner.score }
        )
        events.broadcast(topic.ShowPopup,
            { message: winMsg + ' ' + winner.score }
        )
        webSocket.broadcast( socketTopic.ShowPopup,
             { message: winner.playerName + ' wins!' + ' ' + winner.score }
        )
    }

    /** check all scoreElements to see if game is complete */
    isGameComplete() {
        let result = true
        this.scoreItems.forEach((thisComponent: any) => {
            if (!thisComponent.owned) {
                result = false
            }
        })
        return result
    }

    /** sum and show left scoreElements total value */
    setLeftScores() {
        this.leftTotal = 0
        this.players.players.forEach((player: any) => {
            player.score = 0
        })
        let val
        for (let i = 0; i < 6; i++) {
            val = this.scoreItems[i].finalValue
            if (val > 0) {
                this.leftTotal += val
                let owner = this.scoreItems[i].owner
                if (owner) {
                    this.players.addScore(owner, val)
                    if (this.scoreItems[i].hasFiveOfaKind && (dice.fiveOfaKindCount > 1)) {
                        this.players.addScore(owner, 100)
                    }
                }
            }
        }
        if (this.leftTotal > 62) {
            let bonusWinner = this.players.fromIndex(0)
            let highleft = 0
            this.players.players.forEach((thisPlayer: any) => {
                if (thisPlayer.score > highleft) {
                    highleft = thisPlayer.score
                    bonusWinner = thisPlayer
                }
            })

            this.players.addScore(bonusWinner, 35)
            events.broadcast(
                topic.UpdateLabel + 'leftscore',
                {
                    state: 0,
                    color: bonusWinner.color,
                    textColor: snowColor,
                    text: `^ total = ${this.leftTotal.toString()} + 35`
                }
            )
        }
        else {
            events.broadcast(
                topic.UpdateLabel + 'leftscore',
                {
                    state: 0,
                    color: grayColor,
                    textColor: snowColor,
                    text: '^ total = ' + this.leftTotal.toString()
                }
            )
        }
        if (this.leftTotal === 0) {
            events.broadcast(
                topic.UpdateLabel + 'leftscore',
                {
                    state: 0,
                    color: grayColor,
                    textColor: snowColor,
                    text: '^ total = 0'
                }
            )
        }
    }

    /** sum the values of the right scoreElements */
    setRightScores() {
        let val
        let len = this.scoreItems.length
        for (let i = 6; i < len; i++) {
            val = this.scoreItems[i].finalValue
            if (val > 0) {
                let owner = this.scoreItems[i].owner
                if (owner) {
                    this.players.addScore(owner, val)
                    if (this.scoreItems[i].hasFiveOfaKind
                        && (dice.fiveOfaKindCount > 1)
                        && (i !== Possible.FiveOfaKindIndex)
                    ) {
                        this.players.addScore(owner, 100)
                    }
                }
            }
        }
    }
}
