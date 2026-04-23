import { useState, useEffect, useRef } from 'react'

/**
 * Função auxiliar para gerar o estado inicial das três torres.
 * Cria um array com os discos empilhados na primeira torre (índice 0)
 * do maior para o menor, e deixa as outras duas vazias.
 */
const gerarTorresIniciais = (quantidade) => {
  const primeiraTorre = []
  for (let i = quantidade; i >= 1; i--) {
    primeiraTorre.push(i)
  }
  return [primeiraTorre, [], []]
}

/**
 * Algoritmo recursivo clássico para resolver a Torre de Hanói.
 * Calcula todos os movimentos necessários de forma invisível e
 * salva os passos na variável 'listaDeMovimentos'.
 */
const calcularMovimentos = (n, origem, destino, auxiliar, listaDeMovimentos) => {
  if (n === 1) {
    listaDeMovimentos.push({ de: origem, para: destino })
    return
  }
  // 1. Move n-1 discos da origem para a torre auxiliar
  calcularMovimentos(n - 1, origem, auxiliar, destino, listaDeMovimentos)
  // 2. Move o maior disco da origem para o destino
  listaDeMovimentos.push({ de: origem, para: destino })
  // 3. Move os n-1 discos da auxiliar para o destino
  calcularMovimentos(n - 1, auxiliar, destino, origem, listaDeMovimentos)
}

function App() {
  // --- ESTADOS DA APLICAÇÃO (STATE) ---
  const [numDisks, setNumDisks] = useState(3) // Quantidade atual de discos
  const [towers, setTowers] = useState(gerarTorresIniciais(3)) // Estrutura principal do jogo (Array de 3 arrays)
  const [moveCount, setMoveCount] = useState(0) // Contador de jogadas
  const [movesFeed, setMovesFeed] = useState([]) // Histórico de texto para o feed lateral
  const [selectedTower, setSelectedTower] = useState(null) // Guarda o índice da torre selecionada para mover
  const [history, setHistory] = useState([]) // Pilha de estados para a função "Voltar um passo"
  const [isSolving, setIsSolving] = useState(false) // Trava os botões enquanto a resolução automática roda
  const [errorMessage, setErrorMessage] = useState(null) // Gerencia a mensagem de alerta customizada

  const feedEndRef = useRef(null) // Referência para manipular a rolagem do feed

  // Efeito para rolar o feed lateral automaticamente para baixo a cada novo movimento
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [movesFeed])

  // Efeito para remover as margens padrão do navegador e travar a rolagem da página inteira
  useEffect(() => {
    document.body.style.margin = "0"
    document.body.style.overflow = "hidden"
  }, [])

  // Cálculos dinâmicos
  const minMoves = (2 ** numDisks) - 1 // Fórmula matemática para o mínimo de movimentos (2^n - 1)
  const isVictory = towers[2].length === numDisks && numDisks > 0 // Checa se a última torre tem todos os discos

  /**
   * Exibe uma mensagem de erro na tela que desaparece automaticamente após 3 segundos.
   */
  const showError = (msg) => {
    setErrorMessage(msg)
    setTimeout(() => {
      setErrorMessage(null)
    }, 3000)
  }

  /**
   * Zera todos os estados e reinicia o jogo com a quantidade de discos atual.
   */
  const reiniciarJogo = (quantidadeDiscos = numDisks) => {
    setTowers(gerarTorresIniciais(quantidadeDiscos))
    setMoveCount(0)
    setMovesFeed([])
    setSelectedTower(null)
    setHistory([])
    setErrorMessage(null)
  }

  /**
   * Lida com a mudança no menu dropdown de quantidade de discos.
   */
  const handleDiskChange = (event) => {
    const quantidade = parseInt(event.target.value, 10)
    setNumDisks(quantidade)
    reiniciarJogo(quantidade)
  }

  /**
   * Resolve o jogo automaticamente gerando "frames" de animação
   * e usando setInterval para reproduzi-los na tela.
   */
  const resolverDeUmaVez = () => {
    setIsSolving(true)
    reiniciarJogo(numDisks)

    // Coleta a solução matemática
    const movimentos = []
    calcularMovimentos(numDisks, 0, 2, 1, movimentos)

    // Simula a resolução para capturar o estado exato de cada frame
    let torresSimuladas = gerarTorresIniciais(numDisks)
    const frames = []
    const feedSimulado = []

    movimentos.forEach((mov, index) => {
      const novasTorres = torresSimuladas.map(t => [...t])
      const discoViajante = novasTorres[mov.de].pop()
      novasTorres[mov.para].push(discoViajante)

      feedSimulado.push(`Movimento ${index + 1} (Auto):\nDisco ${discoViajante} da Torre ${mov.de + 1} para a Torre ${mov.para + 1}`)

      frames.push({ towers: novasTorres, moveCount: index + 1, movesFeed: [...feedSimulado] })
      torresSimuladas = novasTorres
    })

    // Dá play na "gravação" dos frames
    let frameAtual = 0
    const intervalo = setInterval(() => {
      if (frameAtual >= frames.length) {
        clearInterval(intervalo)
        setIsSolving(false)
        return
      }
      const frame = frames[frameAtual]
      setTowers(frame.towers)
      setMoveCount(frame.moveCount)
      setMovesFeed(frame.movesFeed)
      setHistory(prev => [...prev, frame]) // Salva o histórico para permitir voltar os passos automáticos
      frameAtual++
    }, 500) // Velocidade da animação (500ms)
  }

  /**
   * Desfaz o último movimento puxando o estado anterior da pilha (history).
   */
  const undoMove = () => {
    if (history.length === 0 || isSolving || isVictory) return
    const lastState = history[history.length - 1]
    setTowers(lastState.towers)
    setMoveCount(lastState.moveCount)
    setMovesFeed(lastState.movesFeed)
    setHistory(prev => prev.slice(0, -1)) // Remove o último frame do histórico
    setSelectedTower(null)
  }

  /**
   * Motor principal de interação do usuário. Valida regras e move os discos entre as torres.
   */
  const handleTowerClick = (clickedIndex) => {
    if (isSolving || isVictory) return

    // Primeiro clique: seleciona a torre se ela tiver discos
    if (selectedTower === null) {
      if (towers[clickedIndex].length > 0) setSelectedTower(clickedIndex)
      return
    }

    // Clique na mesma torre: cancela a seleção
    if (selectedTower === clickedIndex) {
      setSelectedTower(null)
      return
    }

    // Segundo clique: tenta mover o disco para a torre de destino
    const sourceTower = towers[selectedTower]
    const destTower = towers[clickedIndex]
    const diskToMove = sourceTower[sourceTower.length - 1]
    const topDestDisk = destTower[destTower.length - 1]

    // Validação da regra principal: o destino deve estar vazio ou o disco de destino deve ser maior
    if (!topDestDisk || topDestDisk > diskToMove) {
      // Salva o estado atual antes de mudar (para o botão "Voltar")
      setHistory(prev => [...prev, { towers, moveCount, movesFeed }])

      const newTowers = [...towers]
      newTowers[selectedTower] = [...sourceTower]
      newTowers[clickedIndex] = [...destTower]

      // Executa a transferência do disco
      newTowers[selectedTower].pop()
      newTowers[clickedIndex].push(diskToMove)

      // Atualiza a tela
      setTowers(newTowers)
      setSelectedTower(null)
      setMoveCount(prev => prev + 1)
      setMovesFeed(prev => [...prev, `Movimento ${moveCount + 1}:\nDisco ${diskToMove} da Torre ${selectedTower + 1} para a Torre ${clickedIndex + 1}`])
      setErrorMessage(null)
    } else {
      showError("Movimento inválido!\nVocê não pode colocar um disco maior sobre um menor.")
      setSelectedTower(null)
    }
  }

  // --- ESTILOS COMPARTILHADOS ---
  const buttonStyle = {
    padding: '8px 16px',
    cursor: 'pointer',
    backgroundColor: '#333',
    color: '#ccc',
    border: '1px solid #444',
    borderRadius: '4px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    fontFamily: "'Saira Semi Condensed', sans-serif"
  }

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    width: '190px'
  }

  // --- RENDERIZAÇÃO DA INTERFACE (JSX) ---
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: "'Saira Semi Condensed', sans-serif", backgroundColor: '#1e1e1e', color: '#cccccc', position: 'relative' }}>

      {/* Importação de fontes customizadas do Google Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Saira+Semi+Condensed:wght@400;700&display=swap');
        `}
      </style>

      {/* LADO ESQUERDO: Área Principal do Jogo */}
      <div style={{ flex: 2, padding: '30px 20px 50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', overflowY: 'auto' }}>

        {/* Alerta flutuante de erro */}
        {errorMessage && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255, 77, 79, 0.95)', color: 'white', padding: '16px 32px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontWeight: 'bold', zIndex: 1000, transition: 'all 0.3s', textAlign: 'center', whiteSpace: 'pre-line', fontSize: '16px', minWidth: '480px' }}>
            {errorMessage}
          </div>
        )}

        <h1 style={{ marginTop: 0, color: '#ffffff', fontFamily: "'Orbitron', sans-serif", letterSpacing: '2px', marginBottom: '10px' }}>
          Torre de Hanói
        </h1>

        {/* Instruções do Jogo */}
        <p style={{ color: '#aaaaaa', fontSize: '14px', maxWidth: '750px', textAlign: 'center', margin: '0 0 25px 0', lineHeight: '1.5' }}>
          <strong>Objetivo:</strong> Mover todos os discos para a última torre.<br />
          <strong>Regras:</strong> Mova um disco por vez. Um disco maior nunca pode ficar sobre um menor.<br />
          <strong>Como jogar:</strong> Clique numa torre para selecionar o disco do topo e, em seguida, clique na torre de destino.
        </p>

        {/* Painel de Controle e Status */}
        <div style={{ minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
          {isVictory ? (
            <div style={{ backgroundColor: moveCount === minMoves ? '#28a745' : '#17a2b8', color: 'white', padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', maxWidth: '600px' }}>
              {moveCount === minMoves ? (
                <>🏆 Impecável! Resolução perfeita alcançada.<br />Foram exatos {minMoves} movimentos! 🏆</>
              ) : (
                <>👏 Parabéns! Você concluiu em {moveCount} movimentos.<br />(É possível resolver em apenas {minMoves}!) 👏</>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Quantidade de Discos:</label>
                <select value={numDisks} onChange={handleDiskChange} disabled={isSolving} style={{ padding: '5px', fontSize: '16px', backgroundColor: '#333', color: 'white', border: '1px solid #444', fontFamily: "'Saira Semi Condensed', sans-serif" }}>
                  {[3, 4, 5, 6, 7, 8].map(num => (<option key={num} value={num}>{num}</option>))}
                </select>
              </div>
              <p style={{ margin: '5px 0' }}>Movimentos Mínimos: <strong>{minMoves}</strong></p>
              <p style={{ margin: '5px 0' }}>Os seus Movimentos: <strong style={{ color: '#ffffff' }}>{moveCount}</strong></p>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={resolverDeUmaVez} disabled={isSolving || isVictory} style={{ ...primaryButtonStyle, cursor: (isSolving || isVictory) ? 'not-allowed' : 'pointer', opacity: (isSolving || isVictory) ? 0.6 : 1 }}>
            {isSolving ? 'Resolvendo...' : 'Resolver de uma vez'}
          </button>
          <button onClick={undoMove} disabled={history.length === 0 || isSolving || isVictory} style={{ ...buttonStyle, cursor: (history.length === 0 || isSolving || isVictory) ? 'not-allowed' : 'pointer', opacity: (history.length === 0 || isSolving || isVictory) ? 0.5 : 1 }}>
            Voltar um passo
          </button>
          <button onClick={() => reiniciarJogo()} disabled={isSolving} style={{ ...buttonStyle, cursor: isSolving ? 'not-allowed' : 'pointer', opacity: isSolving ? 0.5 : 1 }}>
            Reiniciar tudo
          </button>
        </div>

        {/* Renderização Dinâmica das Torres e Discos */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end', height: '240px', marginTop: '20px' }}>
          {towers.map((tower, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div onClick={() => handleTowerClick(index)} style={{ width: '180px', height: '200px', borderBottom: '10px solid #cccccc', position: 'relative', display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', cursor: (isSolving || isVictory) ? 'not-allowed' : 'pointer', backgroundColor: selectedTower === index ? 'rgba(0, 123, 255, 0.2)' : 'transparent', borderRadius: '10px 10px 0 0', transition: 'background-color 0.2s' }}>
                <div style={{ position: 'absolute', width: '10px', height: '100%', backgroundColor: '#8b4513', zIndex: 0 }}></div>
                {tower.map((disk) => (
                  <div key={disk} style={{ width: `${disk * 18 + 20}px`, height: '16px', backgroundColor: '#007bff', borderRadius: '10px', border: '2px solid #0056b3', marginBottom: '2px', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {disk}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontWeight: 'bold', color: '#cccccc' }}>Torre {index + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LADO DIREITO: Feed de Ações */}
      <div style={{ flex: 1, borderLeft: '1px solid #444', padding: '20px', backgroundColor: '#252526', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
        <h2 style={{ marginTop: 0, color: '#ffffff', fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px' }}>Feed de Movimentos</h2>
        {movesFeed.length === 0 ? (<p style={{ color: '#888' }}>Nenhum movimento ainda...</p>) : (
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            {movesFeed.map((move, index) => (
              <li key={index} style={{ marginBottom: '15px', color: move.includes('(Auto)') ? '#ff4d4f' : '#cccccc', whiteSpace: 'pre-line', lineHeight: '1.4' }}>{move}</li>
            ))}
            <div ref={feedEndRef} />
          </ul>
        )}
      </div>

    </div>
  )
}

export default App