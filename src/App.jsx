import { useState, useEffect, useRef } from 'react'
import './App.css'

const suits = [
  { name: 'Hearts', symbol: '♥', color: 'red' },
  { name: 'Diamonds', symbol: '♦', color: 'red' },
  { name: 'Clubs', symbol: '♣', color: 'black' },
  { name: 'Spades', symbol: '♠', color: 'black' }
]

const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']

function App() {
  const [groups, setGroups] = useState([])
  const [revealed, setRevealed] = useState(Array(13).fill(false))
  const [selected, setSelected] = useState([])
  const [moves, setMoves] = useState(0)
  const [isWon, setIsWon] = useState(false)
  const [animations, setAnimations] = useState(Array(13).fill(null))
  const locked = useRef(false)

  const initGame = () => {
    const deck = []

    ranks.forEach(rank => {
      suits.forEach(suit => {
        deck.push({ suit, rank, id: `${suit.name}-${rank}-${Math.random()}` })
      })
    })

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }

    const newGroups = Array.from({ length: 13 }, (_, i) =>
      deck.slice(i * 4, i * 4 + 4)
    )

    setGroups(newGroups)
    setRevealed(Array(13).fill(false))
    setSelected([])
    setMoves(0)
    setIsWon(false)
    setAnimations(Array(13).fill(null))
    locked.current = false
  }

  useEffect(() => { initGame() }, [])

  const handleClick = (idx) => {
    if (locked.current) return
    if (!groups[idx] || groups[idx].length === 0) return
    if (revealed[idx]) return
    if (selected.includes(idx)) return

    const newRevealed = [...revealed]
    newRevealed[idx] = true
    setRevealed(newRevealed)

    const newSelected = [...selected, idx]
    setSelected(newSelected)

    if (newSelected.length === 2) {
      locked.current = true
      const [a, b] = newSelected
      setMoves(prev => prev + 1)

      if (groups[a][0].rank === groups[b][0].rank) {
        setTimeout(() => {
          const newAnim = [...animations]
          newAnim[a] = 'match'
          newAnim[b] = 'match'
          setAnimations(newAnim)

          setTimeout(() => {
            const updatedGroups = groups.map((g, i) =>
              i === a || i === b ? g.slice(1) : g
            )
            setGroups(updatedGroups)
            setRevealed(Array(13).fill(false))
            setSelected([])
            setAnimations(Array(13).fill(null))

            setGroups(updatedGroups)

            if (updatedGroups.flat().length === 0) {
              setIsWon(true)
}
            locked.current = false
          }, 880)
        }, 620)
      } else {
        const newAnim = [...animations]
        newAnim[a] = 'mismatch'
        newAnim[b] = 'mismatch'
        setAnimations(newAnim)

        setTimeout(() => {
          const flipBack = [...newAnim]
          flipBack[a] = 'flipback'
          flipBack[b] = 'flipback'
          setAnimations(flipBack)

          const resetRev = [...newRevealed]
          resetRev[a] = false
          resetRev[b] = false
          setRevealed(resetRev)

          setTimeout(() => {
            setSelected([])
            setAnimations(Array(13).fill(null))
            locked.current = false
          }, 650)
        }, 900)
      }
    }
  }

  return (
    <div className="container">
      <h2>Playing Cards Matching Game</h2>
      <div className="header">
        <span>Moves: {moves}</span>
        <button className="restart-btn" onClick={initGame}>Restart</button>
      </div>

      <div className="board">
        {groups.map((group, idx) => {
          const card = group[0]
          const isRevealed = revealed[idx]
          const anim = animations[idx]

          if (!card) return <div key={idx} className="slot empty" />

          return (
            <div key={idx} className="slot">
              <div
                className={[
                  'card',
                  isRevealed ? 'flipped' : '',
                  anim === 'mismatch' ? 'shake' : '',
                  anim === 'flipback' ? 'flipback' : '',
                  anim === 'match' ? 'matchremove' : ''
                ].filter(Boolean).join(' ')}
                onClick={() => handleClick(idx)}
              >
                <div className="card-face card-back" />
                <div className={`card-face card-front ${card.suit.color}`}>
                  <span className="corner top-left">
                    <span className="rank">{card.rank}</span>
                    <span className="suit-small">{card.suit.symbol}</span>
                  </span>
                  <span className="suit-center">{card.suit.symbol}</span>
                  <span className="corner bottom-right">
                    <span className="rank">{card.rank}</span>
                    <span className="suit-small">{card.suit.symbol}</span>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isWon && (
        <div className="overlay">
          <div className="win-box">
            <h3>Congratulations! 🎉</h3>
            <p>Total Moves: {moves}</p>
            <button onClick={initGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App