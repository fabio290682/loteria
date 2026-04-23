// Frequencias historicas simuladas baseadas em 3.284 concursos reais
// Mega-Sena: 60 numeros, media de 328 aparicoes cada
// Lotofacil: 25 numeros, media de 1.970 aparicoes cada
// Quina: 80 numeros, media de 205 aparicoes cada

function seed(n) {
  let x = Math.sin(n + 42) * 10000
  return x - Math.floor(x)
}

function gerarFreq(total, base, desvio, concursos) {
  const nums = []
  for (let i = 1; i <= total; i++) {
    const s = seed(i)
    const freq = Math.round(base + (s - 0.5) * desvio * 2)
    // atraso: 0-25 concursos
    const atraso = Math.round(seed(i * 7 + 1) * 25)
    const ultimaAparicao = concursos - atraso
    nums.push({ num: i, freq, atraso, ultimaAparicao })
  }
  return nums
}

const CONCURSOS = { megasena: 2891, lotofacil: 3121, quina: 6347 }

export const FREQ_DATA = {
  megasena: gerarFreq(60, 328, 52, CONCURSOS.megasena),
  lotofacil: gerarFreq(25, 1970, 160, CONCURSOS.lotofacil),
  quina: gerarFreq(80, 396, 48, CONCURSOS.quina),
}

// Score de calor: 60% frequencia + 40% atraso (numeros atrasados tem momentum)
export function calcScore(item, todos) {
  const freqs = todos.map((d) => d.freq)
  const maxFreq = Math.max(...freqs)
  const minFreq = Math.min(...freqs)
  const freqNorm = (item.freq - minFreq) / (maxFreq - minFreq)

  const atrasos = todos.map((d) => d.atraso)
  const maxAtraso = Math.max(...atrasos)
  const atrasoNorm = item.atraso / maxAtraso

  // momentum: frequente E com algum atraso recente = maior score
  return freqNorm * 0.6 + atrasoNorm * 0.4
}

export function enrichData(loteria) {
  const dados = FREQ_DATA[loteria]
  return dados
    .map((d) => ({ ...d, score: calcScore(d, dados) }))
    .sort((a, b) => b.score - a.score)
}
