import React from 'react'
import './App.css'

import loading from './Ripple-1s-200px.gif' 

import { Button, Container, Row, Col } from 'reactstrap'

import Socket from './utils/socket'

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      myId: '',
      myUsername: '',
      mySymbol: '',
      opponentSymbol: '',
      currentPlayer: 'O',
      gameStarted: false,
      findingGame: false,
      playerOne: '',
      playerTwo: '',
      board: ['','','','','','','','',''],
      hover: ['','','','','','','','',''],
    }
  }

  getLorem = () => {
    const lorem = [
      'Lorem ipsum dolor sit amet.',
      'Consectetur adipiscing elit.',
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam.',
      'Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident.',
      'Sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
      'Totam rem aperiam.',
      'Eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
      'Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
      'Neque porro quisquam est.',
      'Qui dolorem ipsum quia dolor sit amet.',
      'Consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
      'Ut enim ad minima veniam.',
      'Quis nostrum exercitationem ullam corporis suscipit laboriosam.',
      'Nisi ut aliquid ex ea commodi consequatur?',
      'Vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
      'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
      'Similique sunt in culpa qui officia deserunt mollitia animi.',
      'Id est laborum et dolorum fuga.',
      'Et harum quidem rerum facilis est et expedita distinctio.',
      'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.',
      'Omnis voluptas assumenda est, omnis dolor repellendus.',
      'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.',
      'Itaque earum rerum hic tenetur a sapiente delectus.',
      'Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.',
    ]
    return lorem[Math.floor(Math.random()*lorem.length)]
  }

  handleClick = (index) => {
    if (!this.state.gameStarted) { return }
    if (this.state.mySymbol !== this.state.currentPlayer) { return }
    if (this.checkGame() !== 'ongoing') { return }
    if (this.state.board[index] !== '') { return }
    const board = [...this.state.board]
    board[index] = this.state.currentPlayer
    this.setState({ board })
    if (this.checkGame() === 'ongoing') { this.changePlayer() }
    const gameMove = {
      username: this.state.myUsername,
      message: this.getLorem(),
      timestamp: Date.now(),
      tictactoe: { action: 'move', played: index, target: this.state.myOpponent }
    }
    Socket.emit('BROADCAST_MESSAGE', gameMove)

  }

  handleConnect = () => {
    this.resetBoard()
    this.setState({
      gameStarted: false,
      findingGame: true,
      playerOne: '',
      playerTwo: '',
      myOpponent: '',
      mySymbol: '',
      opponentSymbol: '',
    })
    const gameLooking = {
      username: this.state.myUsername,
      message: this.getLorem(),
      timestamp: Date.now(),
      tictactoe: { action: 'finding' }
    }
    Socket.emit('BROADCAST_MESSAGE', gameLooking)
  }


  isEqual = (x,y,z) => { if ((x !== '') && (x === y) && (x === z)) { return true } }

  checkGame = () => {
    const board = this.state.board
    const winCondition = [
      [0,1,2],
      [0,3,6],
      [0,4,8],
      [1,4,7],
      [2,4,6],
      [2,5,8],
      [3,4,5],
      [6,7,8],
    ]
    for(let i = 0; i < winCondition.length; i++) {
      const index = winCondition[i]
      if (this.isEqual(board[index[0]],board[index[1]],board[index[2]])) {
        return index
      }
    }
    if (this.checkDraw() === true) { return 'draw' }
    return 'ongoing'
  }

  checkDraw = () => {
    const board = this.state.board
    for (let i = 0; i < board.length; i++) { if (board[i] === '') { return false } }
    return true
  }

  changePlayer = () => {
    if (this.state.currentPlayer === 'O') { this.setState({currentPlayer: 'X'}) }
    else this.setState({currentPlayer: 'O'}) 
  }

  resetBoard = () => {
   this.setState({ 
     board: ['','','','','','','','',''],
     currentPlayer: 'O',
    })
  }

  mouseEnter = (index) => {
    if (!this.state.gameStarted) { return }
    if (this.state.mySymbol !== this.state.currentPlayer) { return }
    if (this.state.board[index] !== '') { return }
    const hover = ['','','','','','','','','']
    hover[index] = this.state.mySymbol
    this.setState({ hover })
  }

  mouseLeave = (index) => {
    const hover = [...this.state.hover]
    hover[index] = ''
    this.setState({ hover })    
  }

  componentDidMount() {
    Socket.emit('NEW_USER')

    Socket.on('GET_CURRENT_USER', user => {
      this.setState({ 
        myId: user.id,
        myUsername: user.username,
      })
    })

    Socket.on('RECEIVE_BROADCAST', response => {
      if (!response.tictactoe) { return }
      if (response.username === this.state.myUsername ) { return }

      if (response.tictactoe.action === 'move') {
        if (response.tictactoe.played === undefined ) { return }
        if (response.tictactoe.target !== this.state.myUsername) { return }
        if (response.username !== this.state.myOpponent) { return }
        let board = [...this.state.board]
        board[response.tictactoe.played] = this.state.currentPlayer
        this.setState({ board })
        if (this.checkGame() === 'ongoing') { this.changePlayer() }
      }

      if (response.tictactoe.action === 'connect') {
        if (response.tictactoe.target !== this.state.myUsername) { return }
        if (!this.state.findingGame) { return }
        this.setState({ 
          playerOne: this.state.myUsername,
          playerTwo: response.username,
          myOpponent: response.username,
          mySymbol: 'O',
          opponentSymbol: 'X',
          findingGame: false,
          gameStarted: true,
        })
        const gameAccept = {
          username: this.state.myUsername,
          message: this.getLorem(),
          timestamp: Date.now(),
          tictactoe: { action: 'connect-accept', target: response.username }
        }
        Socket.emit('BROADCAST_MESSAGE', gameAccept)
      }

      if (response.tictactoe.action === 'connect-accept') {
        if (!this.state.findingGame) { return }
        if (response.tictactoe.target !== this.state.myUsername) { return }
        this.setState({ 
          playerOne: response.username,
          playerTwo: this.state.myUsername,
          myOpponent: response.username,
          mySymbol: 'X',
          opponentSymbol: 'O',
          findingGame: false,
          gameStarted: true,
        })
      }

      if (response.tictactoe.action === 'finding') {
        if (!this.state.findingGame) { return }
        const gameConnect = {
          username: this.state.myUsername,
          message: this.getLorem(),
          timestamp: Date.now(),
          tictactoe: { action: 'connect', target: response.username }
        }
        Socket.emit('BROADCAST_MESSAGE', gameConnect)
      }

    })
  }

  render() {

    let boardComponents = this.state.board.map((box, index) => {

      let spanClass = "lead display-3 font-weight-bold "
      if (this.state.board[index] === 'O') { spanClass += "text-playerone " }
      else { spanClass += "text-playertwo "}
      if (this.checkGame().indexOf(index) !== -1) { spanClass += "winning-combo-bois " }

      let divClass = "game-tile "
      if (index !== 6 && index !== 7 && index !== 8) { divClass += "border-tac-bottom " }
      if (index !== 2 && index !== 5 && index !== 8) { divClass += "border-tac-right " }
      if (this.checkGame().indexOf(index) !== -1) { divClass += "winning-combo-lads " }

      return (
        <div 
          key={index} 
          className={divClass}
          onClick={() => this.handleClick(index)} 
          onMouseEnter={() => this.mouseEnter(index)}
          onMouseLeave={() => this.mouseLeave(index)}
        >
          {this.state.board[index] !== '' ? 
            <span className={spanClass}>{this.state.board[index]}</span> :
            <span className="lead display-3 font-weight-bold text-playerhover">{this.state.hover[index]}</span>
          }
        </div>
      )})

    return (
    <Container fluid>
      <Row>
        <Col md="12" className="bg-dark d-flex py-4 justify-content-center align-items-center flex-column text-center cursor-default top-status-minh">

          { !this.state.myUsername ? 
            <React.Fragment>
              <img src={loading} alt="Mount-Loader" width="75" height="75"></img>
              <p className="text-light lead my-0" style={{fontSize:22}}>Contacting server...</p>
            </React.Fragment>
            : null }

          { !this.state.findingGame && !this.state.gameStarted && this.state.myUsername ? 
            <React.Fragment>
              <p className="text-light lead my-0" style={{fontSize:22}}>Multiplayer Pepega Toe</p>
              <p className="text-light lead my-0" style={{fontSize:22}}>Hello, {this.state.myUsername}.</p>
            </React.Fragment>
            : null }

          { this.state.findingGame ? 
            <React.Fragment>
              <img src={loading} alt="Find-Loader" width="75" height="75"></img>
              <p className="text-light lead my-0" style={{fontSize:22}}>Looking for players...</p>
            </React.Fragment>
            : null }

          { this.state.gameStarted ?
            <React.Fragment>

              <p className="lead my-0 text-success" style={{fontSize:25}}><span className="font-weight-bold">[O]</span> {this.state.playerOne} {this.state.playerOne === this.state.myUsername && this.state.myUsername !== '' ? '(You)' : null}</p>
              <p className="lead mt-0 mb-2 text-primary" style={{fontSize:25}}><span className="font-weight-bold">[X]</span> {this.state.playerTwo} {this.state.playerTwo === this.state.myUsername && this.state.myUsername !== '' ? '(You)' : null}</p>

              { this.state.board[this.checkGame()[0]] === this.state.mySymbol ? 
                <p className="lead text-light text-center my-0" style={{fontSize:22}}>You won!</p> 
                : null }

              { this.state.board[this.checkGame()[0]] === this.state.opponentSymbol ? 
                <p className="lead text-light text-center my-0" style={{fontSize:22}}>You lost!</p>
                : null } 

              { this.checkGame() === 'draw' ? 
                <p className="lead text-light text-center my-0" style={{fontSize:22}}>It's a draw!</p> 
                : null }
              { this.checkGame() === 'ongoing' && this.state.gameStarted === true ? 
                <p className="lead text-light text-center my-0" style={{fontSize:22}}>
                  { this.state.currentPlayer === this.state.mySymbol ? 
                    "It's your turn." : 
                    `Waiting for ${this.state.myOpponent}'s move.`}
                </p> : null }

            </React.Fragment> : null }

        </Col>  

        <Col md="12" className="">
          <div>
            <div className="mt-3 pt-2 text-center">
              <Button color="primary" onClick={this.handleConnect} disabled={!this.state.myUsername || this.state.findingGame || ((this.checkGame() === 'ongoing') && this.state.gameStarted)} className="mt-2 mx-2">Find a game</Button>
            </div>
          </div>
          <div id="game-board">{boardComponents}</div>
        </Col>
      </Row>
    </Container>
    )
  } 
}

export default App
