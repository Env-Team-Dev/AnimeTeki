<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Game state
const loading = ref(true)
const errorMessage = ref(null)
const characterPool = ref([])

// Gameplay state
const currentRound = ref(1)
const totalRounds = 10
const score = ref(0)
const streak = ref(0)
const lives = ref(3)
const maxLives = 3
const highScore = ref(0)

const currentCharacter = ref(null)
const choices = ref([])
const selectedChoice = ref(null)
const roundResolved = ref(false)
const isGameOver = ref(false)
const isGameComplete = ref(false)

// Zoom & Crop Clues
const zoomLevel = ref(3.2) // 3.2 -> 2.0 -> 1.0
const cropFocus = ref({ x: 50, y: 35 })
const isAnimeHintRevealed = ref(false)

// Timer
const timer = ref(15)
const maxTime = 15
let timerInterval = null

// Fallback characters if API fails or rate-limited
const fallbackCharacters = [
  { id: 1, fullName: 'Satoru Gojou', animeTitle: 'Jujutsu Kaisen', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png' },
  { id: 2, fullName: 'Levi Ackerman', animeTitle: 'Shingeki no Kyojin', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b45627-CR68RyZmddGG.png' },
  { id: 3, fullName: 'Monkey D. Luffy', animeTitle: 'One Piece', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png' },
  { id: 4, fullName: 'Killua Zoldyck', animeTitle: 'Hunter x Hunter', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b27-Z5O02kQUydpT.jpg' },
  { id: 5, fullName: 'Eren Yeager', animeTitle: 'Shingeki no Kyojin', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40882-dsj7IP943WFF.jpg' },
  { id: 6, fullName: 'Roronoa Zoro', animeTitle: 'One Piece', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b62-6iU2n1lq7bWf.png' },
  { id: 7, fullName: 'Naruto Uzumaki', animeTitle: 'Naruto', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b17-guUXOxP0tuu3.png' },
  { id: 8, fullName: 'Light Yagami', animeTitle: 'Death Note', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b80-VfM5b79Q5M2P.png' },
  { id: 9, fullName: 'Saitama', animeTitle: 'One Punch Man', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b73935-FvF28fN51pfe.png' },
  { id: 10, fullName: 'Edward Elric', animeTitle: 'Fullmetal Alchemist', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b11-zXyEaI1VfXn4.png' },
  { id: 11, fullName: 'Megumin', animeTitle: 'Kono Subarashii Sekai ni Shukufuku wo!', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b89361-9pE6wP4mH62a.png' },
  { id: 12, fullName: 'Tanjiro Kamado', animeTitle: 'Kimetsu no Yaiba', image: 'https://s4.anilist.co/file/anilistcdn/character/large/b126071-GjW02zI2M8hZ.png' }
]

const goBack = () => {
  stopTimer()
  router.push('/')
}

const loadHighScore = () => {
  const saved = localStorage.getItem('animeteki_whoisit_highscore')
  if (saved) {
    highScore.value = parseInt(saved, 10) || 0
  }
}

const updateHighScore = () => {
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('animeteki_whoisit_highscore', highScore.value.toString())
  }
}

const fetchCharacters = async () => {
  loading.value = true
  errorMessage.value = null
  let list = []

  const randomPage = Math.floor(Math.random() * 8) + 1

  try {
    const query = `
      query {
        Page(page: ${randomPage}, perPage: 50) {
          characters(sort: [FAVOURITES_DESC]) {
            id
            name {
              full
            }
            image {
              large
            }
            media(perPage: 1, sort: [POPULARITY_DESC]) {
              nodes {
                title {
                  romaji
                  english
                }
              }
            }
          }
        }
      }
    `
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query })
    })

    if (res.ok) {
      const data = await res.json()
      const raw = data?.data?.Page?.characters || []
      list = raw
        .filter(c => c && c.image?.large && c.name?.full)
        .map(c => {
          const mainMedia = c.media?.nodes?.[0]
          return {
            id: c.id,
            fullName: c.name.full,
            image: c.image.large,
            animeTitle: mainMedia?.title?.romaji || mainMedia?.title?.english || 'Anime Populer'
          }
        })
    }
  } catch (err) {
    console.warn('Gagal menghubungi AniList, menggunakan fallback pool.', err)
  }

  if (list.length < 15) {
    list = [...fallbackCharacters]
  }

  characterPool.value = list
  loading.value = false
  startNewGame()
}

const startNewGame = () => {
  score.value = 0
  streak.value = 0
  lives.value = maxLives
  currentRound.value = 1
  isGameOver.value = false
  isGameComplete.value = false
  setupRound()
}

const setupRound = () => {
  if (lives.value <= 0) {
    endGame(false)
    return
  }

  if (currentRound.value > totalRounds) {
    endGame(true)
    return
  }

  roundResolved.value = false
  selectedChoice.value = null
  isAnimeHintRevealed.value = false
  zoomLevel.value = 3.2

  // Random focus point around face/eyes/hair (between 30% - 70%)
  cropFocus.value = {
    x: Math.floor(Math.random() * 30) + 35,
    y: Math.floor(Math.random() * 25) + 25
  }

  // Pick target character
  const targetIndex = Math.floor(Math.random() * characterPool.value.length)
  currentCharacter.value = characterPool.value[targetIndex]

  // Pick 3 random distractors
  const distractors = characterPool.value
    .filter(c => c.id !== currentCharacter.value.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)

  choices.value = [currentCharacter.value, ...distractors].sort(() => 0.5 - Math.random())

  startTimer()
}

const startTimer = () => {
  stopTimer()
  timer.value = maxTime
  timerInterval = setInterval(() => {
    if (timer.value > 0) {
      timer.value--
    } else {
      stopTimer()
      handleTimeOut()
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const zoomOutClue = () => {
  if (zoomLevel.value > 2.0) {
    zoomLevel.value = 2.0
  } else if (zoomLevel.value > 1.2) {
    zoomLevel.value = 1.0
  }
}

const revealAnimeHint = () => {
  isAnimeHintRevealed.value = true
}

const handleChoice = (choice) => {
  if (roundResolved.value) return
  stopTimer()

  selectedChoice.value = choice
  roundResolved.value = true
  zoomLevel.value = 1.0 // Reveal full image

  if (choice.id === currentCharacter.value.id) {
    // Correct!
    streak.value++
    const timeBonus = timer.value * 30
    const streakBonus = (streak.value - 1) * 50
    const zoomPenalty = zoomLevel.value < 2.0 ? 100 : 0
    const earned = Math.max(100, 500 + timeBonus + streakBonus - zoomPenalty)
    score.value += earned
    updateHighScore()
  } else {
    // Incorrect!
    streak.value = 0
    lives.value--
  }
}

const handleTimeOut = () => {
  if (roundResolved.value) return
  roundResolved.value = true
  selectedChoice.value = null
  zoomLevel.value = 1.0
  streak.value = 0
  lives.value--
}

const nextRound = () => {
  if (lives.value <= 0) {
    endGame(false)
  } else if (currentRound.value >= totalRounds) {
    endGame(true)
  } else {
    currentRound.value++
    setupRound()
  }
}

const endGame = (completed = false) => {
  stopTimer()
  updateHighScore()
  if (completed) {
    isGameComplete.value = true
  } else {
    isGameOver.value = true
  }
}

const cropImageStyle = computed(() => {
  if (roundResolved.value) {
    return {
      transform: 'scale(1)',
      transformOrigin: 'center center',
      transition: 'transform 0.5s ease-out'
    }
  }

  return {
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: `${cropFocus.value.x}% ${cropFocus.value.y}%`,
    transition: 'transform 0.4s ease-out'
  }
})

onMounted(() => {
  loadHighScore()
  fetchCharacters()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div 
    class="min-h-screen bg-neutral-950 text-slate-200 font-['Mangat'] relative flex flex-col justify-between selection:bg-red-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed overflow-x-hidden"
    style="background-image: url('/bg.png');"
  >
    <div class="fixed inset-0 pointer-events-none bg-neutral-950/40 z-0"></div>

    <!-- Header -->
    <header class="absolute top-6 right-8 md:right-16 z-30 pointer-events-auto flex items-center gap-4">
      <button 
        @click="goBack" 
        class="bg-white text-black px-4 py-2 border-2 border-black hover:bg-red-600 hover:text-white transition-all font-bold cursor-pointer text-sm md:text-base flex items-center gap-2 shadow-lg"
      >
        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Kembali
      </button>

      <img 
        src="/AnimeTeki.svg" 
        alt="AnimeTeki" 
        class="h-20 md:h-32 w-auto object-contain drop-shadow-[0_12px_28px_rgba(220,38,38,0.45)]" 
      />
    </header>

    <!-- Character Side Illustration -->
    <div class="hidden lg:block fixed left-0 bottom-0 pointer-events-none select-none z-10 leading-none">
      <img 
        src="/987.png" 
        alt="Character Illustration" 
        class="h-[85vh] max-h-[750px] w-auto object-contain object-left-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] block"
      />
    </div>

    <!-- Main Container -->
    <div class="w-full max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-20 flex flex-col lg:flex-row items-center justify-between gap-8 flex-grow">
      <div class="hidden lg:block w-5/12"></div>

      <main class="w-full lg:w-6/12 max-w-lg flex flex-col justify-center my-auto z-20 lg:ml-auto lg:mr-8">
        
        <!-- Loading State -->
        <div v-if="loading" class="bg-white text-black p-8 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mb-4"></div>
          <p class="font-bold uppercase tracking-wider text-sm">Menyiapkan Arena Siluet & Potongan Karakter...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="bg-red-600 text-white p-6 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <p class="font-bold uppercase text-sm mb-4">{{ errorMessage }}</p>
          <button @click="fetchCharacters" class="bg-white text-black px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-neutral-200">
            Coba Lagi
          </button>
        </div>

        <!-- Game Over / Game Complete State -->
        <div v-else-if="isGameOver || isGameComplete" class="bg-white text-black p-8 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
          <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black"></div>
          <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-black"></div>
          <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-black"></div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black"></div>

          <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
               :class="isGameComplete ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'">
            {{ isGameComplete ? '🏆' : '💀' }}
          </div>

          <h2 class="text-3xl font-bold uppercase tracking-wider mb-2"
              :class="isGameComplete ? 'text-emerald-600' : 'text-red-600'">
            {{ isGameComplete ? 'Selamat! Selesai!' : 'Game Over!' }}
          </h2>

          <p class="font-sans text-neutral-600 font-semibold text-sm mb-6">
            {{ isGameComplete ? 'Kamu berhasil menyelesaikan semua 10 ronde dengan gemilang!' : 'Kesempatan kamu telah habis. Jangan patah semangat!' }}
          </p>

          <div class="bg-neutral-100 border-2 border-black p-4 mb-6">
            <div class="flex justify-between items-center py-1 border-b border-neutral-300">
              <span class="font-sans text-xs uppercase font-bold text-neutral-500">Skor Akhir</span>
              <span class="text-2xl font-bold text-black">{{ score }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-neutral-300">
              <span class="font-sans text-xs uppercase font-bold text-neutral-500">Ronde Tercapai</span>
              <span class="font-bold text-black">{{ currentRound }} / {{ totalRounds }}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="font-sans text-xs uppercase font-bold text-neutral-500">Rekor Terbaik</span>
              <span class="font-bold text-red-600">{{ highScore }}</span>
            </div>
          </div>

          <button 
            @click="startNewGame"
            class="w-full bg-red-600 text-white py-3 border-2 border-black font-bold uppercase tracking-widest hover:bg-red-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Main Lagi</span>
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
        </div>

        <!-- Active Round State -->
        <div v-else class="bg-white text-black p-6 border-2 border-black w-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
          <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black"></div>
          <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-black"></div>
          <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-black"></div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black"></div>

          <!-- Top Status Bar -->
          <div class="flex justify-between items-center mb-4 pb-3 border-b-2 border-black text-xs md:text-sm">
            <!-- Lives -->
            <div class="flex items-center gap-1">
              <span 
                v-for="i in maxLives" 
                :key="i" 
                class="text-base select-none transition-transform"
                :class="i <= lives ? 'text-red-600 scale-110' : 'text-neutral-300'"
              >
                ❤
              </span>
            </div>

            <!-- Round & Score -->
            <div class="flex items-center gap-3">
              <span class="font-sans font-bold bg-neutral-200 px-2 py-0.5 border border-black text-[11px]">
                Ronde {{ currentRound }}/{{ totalRounds }}
              </span>
              <span class="font-bold text-red-600 text-base">
                {{ score }} <span class="text-[10px] text-neutral-600 uppercase">PTS</span>
              </span>
            </div>
          </div>

          <!-- Timer Bar -->
          <div class="mb-4">
            <div class="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Waktu Tersisa</span>
              <span :class="timer <= 5 ? 'text-red-600 font-black animate-pulse' : 'text-black'">{{ timer }} Detik</span>
            </div>
            <div class="h-2 w-full bg-neutral-200 border border-black overflow-hidden">
              <div 
                class="h-full transition-all duration-1000 ease-linear"
                :class="timer <= 5 ? 'bg-red-600' : 'bg-black'"
                :style="{ width: (timer / maxTime) * 100 + '%' }"
              ></div>
            </div>
          </div>

          <!-- Image Crop / Puzzle Viewport -->
          <div class="flex justify-center mb-4">
            <div class="w-56 h-64 bg-neutral-900 border-4 border-black overflow-hidden relative shadow-inner flex items-center justify-center">
              <img 
                :src="currentCharacter?.image" 
                :alt="currentCharacter?.fullName"
                class="w-full h-full object-cover select-none pointer-events-none"
                :style="cropImageStyle"
              />

              <!-- Zoom Badge -->
              <div v-if="!roundResolved" class="absolute bottom-2 left-2 bg-black/90 text-white text-[9px] px-2 py-0.5 font-bold tracking-wider border border-white/20">
                ZOOM: {{ zoomLevel > 2.5 ? 'CLOSE-UP' : zoomLevel > 1.2 ? 'MEDIUM' : 'FULL' }}
              </div>

              <!-- Streak Badge -->
              <div v-if="streak > 1" class="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 font-bold tracking-wider animate-bounce">
                COMBO {{ streak }}x!
              </div>
            </div>
          </div>

          <!-- Help / Clue Actions (During Round) -->
          <div v-if="!roundResolved" class="flex items-center justify-between gap-2 mb-4">
            <button 
              @click="zoomOutClue"
              :disabled="zoomLevel <= 1.0"
              class="flex-1 bg-neutral-100 hover:bg-neutral-200 text-black border border-black py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm-4-1h8v2H5.5z"/></svg>
              <span>Perluas Gambar</span>
            </button>

            <button 
              @click="revealAnimeHint"
              :disabled="isAnimeHintRevealed"
              class="flex-1 bg-neutral-100 hover:bg-neutral-200 text-black border border-black py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              <span>Petunjuk Anime</span>
            </button>
          </div>

          <!-- Revealed Hint Box -->
          <div v-if="isAnimeHintRevealed" class="mb-4 bg-yellow-50 border border-black p-2 text-center text-xs font-sans text-neutral-800">
            Asal Anime: <strong class="text-black">{{ currentCharacter?.animeTitle }}</strong>
          </div>

          <!-- Answer Result Banner (When round resolved) -->
          <div v-if="roundResolved" class="mb-4 p-3 border-2 border-black text-center font-bold"
               :class="selectedChoice?.id === currentCharacter?.id ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'">
            <p class="text-sm uppercase tracking-wider">
              {{ selectedChoice?.id === currentCharacter?.id ? 'Tepat Sekali!' : timer === 0 ? 'Waktu Habis!' : 'Tebakan Kurang Tepat!' }}
            </p>
            <p class="text-xs font-sans mt-0.5 font-normal">
              Karakter ini adalah <strong>{{ currentCharacter?.fullName }}</strong> ({{ currentCharacter?.animeTitle }})
            </p>
          </div>

          <!-- 4 Multiple Choice Buttons -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <button 
              v-for="choice in choices"
              :key="choice.id"
              @click="handleChoice(choice)"
              :disabled="roundResolved"
              class="p-3 border-2 border-black font-sans font-bold text-xs uppercase tracking-wide transition-all text-left flex items-center justify-between"
              :class="{
                'bg-emerald-500 text-white border-black': roundResolved && choice.id === currentCharacter?.id,
                'bg-red-600 text-white border-black': roundResolved && selectedChoice?.id === choice.id && choice.id !== currentCharacter?.id,
                'bg-neutral-100 hover:bg-neutral-200 text-black': !roundResolved,
                'opacity-50': roundResolved && choice.id !== currentCharacter?.id && selectedChoice?.id !== choice.id
              }"
            >
              <span class="truncate pr-2">{{ choice.fullName }}</span>
              <span v-if="roundResolved && choice.id === currentCharacter?.id" class="text-white shrink-0">✓</span>
              <span v-else-if="roundResolved && selectedChoice?.id === choice.id && choice.id !== currentCharacter?.id" class="text-white shrink-0">✗</span>
            </button>
          </div>

          <!-- Next Button (When round resolved) -->
          <div v-if="roundResolved">
            <button 
              @click="nextRound"
              class="w-full bg-black text-white py-3 border-2 border-black hover:bg-neutral-800 transition-colors uppercase font-bold tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{{ currentRound >= totalRounds || lives <= 0 ? 'Lihat Hasil Akhir' : 'Ronde Selanjutnya' }}</span>
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M5 13h11.86l-5.43 5.43L13 20l8-8-8-8-1.43 1.43L16.86 11H5v2z"/></svg>
            </button>
          </div>

        </div>

      </main>
    </div>

    <!-- Footer -->
    <footer class="fixed bottom-6 right-8 md:right-16 z-30 flex flex-col items-end gap-1.5 pointer-events-auto">
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-slate-200 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-semibold">Built by</span>
        <div class="flex items-center gap-1.5">
          <img 
            src="/dev/1.png" 
            alt="Dev 1" 
            class="w-7 h-7 rounded-full object-cover border border-neutral-400 hover:border-red-600 transition-all shadow-md"
          />
          <img 
            src="/dev/2.png" 
            alt="Dev 2" 
            class="w-7 h-7 rounded-full object-cover border border-neutral-400 hover:border-red-600 transition-all shadow-md"
          />
        </div>
      </div>
      <p class="text-[11px] text-slate-100 font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">&copy; 2026 EnvTeam</p>
    </footer>
  </div>
</template>