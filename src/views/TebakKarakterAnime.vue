<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(true)
const errorMessage = ref(null)

const popularPool = ref([])
const currentCharacter = ref(null)

const userGuess = ref('')
const attempts = ref(0)
const maxAttempts = 5
const clueLevel = ref(1)
const isWon = ref(false)
const isGameOver = ref(false)
const feedbackMessage = ref('')

const isImageReady = ref(false)
const translatedDescription = ref('')
const isTranslating = ref(false)

const goBack = () => {
  router.push('/')
}

const getLevenshteinDistance = (a, b) => {
  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

const translateGender = (gender) => {
  if (!gender) return 'Tidak Diketahui'
  const g = gender.toLowerCase()
  if (g.includes('female')) return 'Perempuan'
  if (g.includes('male')) return 'Laki-laki'
  return gender
}

const translateRole = (role) => {
  if (!role) return 'Karakter Pendukung'
  const r = role.toLowerCase()
  if (r.includes('main')) return 'Karakter Utama'
  if (r.includes('supporting')) return 'Karakter Pendukung'
  return role
}

const translateToIndonesian = async (text) => {
  if (!text) return ''
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`
    )
    if (response.ok) {
      const data = await response.json()
      return data[0].map(item => item[0]).join('')
    }
  } catch (e) {
    console.warn('Gagal menerjemahkan deskripsi otomatis:', e)
  }
  return text
}

const fetchPopularCharacters = async () => {
  loading.value = true
  errorMessage.value = null
  let charactersList = []

  const randomPage = Math.floor(Math.random() * 30) + 1

  try {
    const query = `
      query {
        Page(page: ${randomPage}, perPage: 50) {
          characters(sort: [FAVOURITES_DESC]) {
            id
            name {
              full
              first
              last
            }
            image {
              large
            }
            gender
            description
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
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query })
    })

    if (response.ok) {
      const result = await response.json()
      const rawData = result?.data?.Page?.characters || []

      if (rawData.length > 0) {
        charactersList = rawData
          .filter(c => c && c.image && c.image.large)
          .map(c => {
            const mainMedia = c.media?.nodes?.[0]
            const animeTitle = mainMedia?.title?.romaji || mainMedia?.title?.english || 'Anime Populer'
            return {
              id: c.id,
              fullName: c.name?.full || 'Karakter Tanpa Nama',
              firstName: c.name?.first || c.name?.full?.split(' ')[0] || '',
              lastName: c.name?.last || c.name?.full?.split(' ')[1] || '',
              image: c.image.large,
              gender: translateGender(c.gender),
              role: translateRole('Karakter Utama'),
              animeTitle: animeTitle,
              description: c.description || 'Karakter anime populer.'
            }
          })
      }
    }
  } catch (e) {
    console.warn('AniList API terkendala, mencoba API Kitsu...', e)
  }

  if (charactersList.length === 0) {
    try {
      const randomKitsuPage = Math.floor(Math.random() * 10) + 1
      const res = await fetch(`https://kitsu.io/api/edge/characters?page[limit]=20&page[offset]=${randomKitsuPage * 10}&sort=-userCount`)
      if (res.ok) {
        const result = await res.json()
        const rawData = result?.data || []
        charactersList = rawData
          .filter(c => c?.attributes?.image?.original)
          .map(c => {
            const attr = c.attributes
            const nameParts = (attr.canonicalName || '').split(' ')
            return {
              id: c.id,
              fullName: attr.canonicalName || 'Karakter Tanpa Nama',
              firstName: nameParts[0] || '',
              lastName: nameParts[1] || '',
              image: attr.image.original,
              gender: 'Perempuan / Laki-laki',
              role: 'Karakter Anime',
              animeTitle: 'Anime Populer',
              description: attr.description || 'Karakter anime terkenal.'
            }
          })
      }
    } catch (e) {
      console.error('Semua API Online gagal diakses.', e)
      errorMessage.value = 'Gagal memuat data online. Periksa koneksi internet Anda.'
    }
  }

  popularPool.value = charactersList
  if (charactersList.length > 0) {
    startNewRound()
  }
  loading.value = false
}

const startNewRound = async () => {
  if (popularPool.value.length === 0) return

  isImageReady.value = false
  isWon.value = false
  isGameOver.value = false
  clueLevel.value = 1
  userGuess.value = ''
  attempts.value = 0
  feedbackMessage.value = ''
  translatedDescription.value = ''

  const randomIndex = Math.floor(Math.random() * popularPool.value.length)
  currentCharacter.value = popularPool.value[randomIndex]

  await nextTick()
}

const handleImageLoad = () => {
  isImageReady.value = true
}

watch(currentCharacter, async (newChar) => {
  if (newChar && newChar.description) {
    isTranslating.value = true
    
    let rawText = newChar.description
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/(Height|Weight|BWH|Blood Type|Age|Birthday):[^\n]*/gi, '')
      .replace(/(\*\*|__|\*|_|#|~|<[^>]*>?)/g, '')
      .replace(/\s+/g, ' ').trim()

    if (rawText.length > 300) {
      rawText = rawText.substring(0, 300) + '...'
    }

    translatedDescription.value = await translateToIndonesian(rawText)
    isTranslating.value = false
  }
}, { immediate: true })

const censoredDescription = computed(() => {
  let text = translatedDescription.value || currentCharacter.value?.description || 'Tidak ada deskripsi rinci yang tersedia.'

  if (isTranslating.value) {
    return 'Menerjemahkan petunjuk deskripsi...'
  }

  const char = currentCharacter.value
  if (char) {
    const nameVariants = [
      char.fullName,
      char.firstName,
      char.lastName
    ].filter(Boolean)

    nameVariants.forEach(name => {
      if (name.length > 2) {
        const regex = new RegExp(name, 'gi')
        text = text.replace(regex, '██████')
      }
    })
  }

  return text
})

const imageBlurStyle = computed(() => {
  if (isWon.value || isGameOver.value) {
    return { 
      filter: 'blur(0px)', 
      opacity: isImageReady.value ? 1 : 0, 
      transition: 'filter 0.5s ease, opacity 0.3s ease' 
    }
  }

  const blurAmount = Math.max(0, 24 - (clueLevel.value - 1) * 7)
  return {
    filter: `blur(${blurAmount}px)`,
    opacity: isImageReady.value ? 1 : 0,
    transition: 'filter 0.5s ease, opacity 0.3s ease'
  }
})

const submitGuess = () => {
  const input = userGuess.value.trim().toLowerCase()
  if (!input || isWon.value || isGameOver.value) return

  const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  const targetFull = clean(currentCharacter.value.fullName)
  const targetFirst = clean(currentCharacter.value.firstName)
  const targetLast = clean(currentCharacter.value.lastName)
  const inputClean = clean(input)

  let isCorrect = false

  if (inputClean.length >= 2) {
    if (targetFull.includes(inputClean) || (targetFirst && inputClean.includes(targetFirst)) || (targetLast && inputClean.includes(targetLast))) {
      isCorrect = true
    } else {
      const distFull = getLevenshteinDistance(inputClean, targetFull)
      const distFirst = targetFirst ? getLevenshteinDistance(inputClean, targetFirst) : 99
      
      if (distFull <= 2 || distFirst <= 2) {
        isCorrect = true
      }
    }
  }

  if (isCorrect) {
    isWon.value = true
    feedbackMessage.value = 'Luar biasa! Tebakanmu tepat!'
  } else {
    attempts.value += 1
    userGuess.value = ''

    if (attempts.value >= maxAttempts) {
      isGameOver.value = true
      feedbackMessage.value = 'Kesempatan telah habis!'
    } else {
      feedbackMessage.value = `Jawaban belum tepat! (Sisa Percobaan: ${maxAttempts - attempts.value})`
      if (clueLevel.value < 4) {
        clueLevel.value += 1
      }
    }
  }
}

const unlockNextClue = () => {
  if (clueLevel.value < 4) {
    clueLevel.value += 1
  }
}

onMounted(() => {
  fetchPopularCharacters()
})
</script>

<template>
  <div 
    class="min-h-screen bg-neutral-950 text-slate-200 font-['Mangat'] relative flex flex-col justify-between selection:bg-red-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed overflow-x-hidden"
    style="background-image: url('/bg.png');"
  >
    <div class="fixed inset-0 pointer-events-none bg-neutral-950/40 z-0"></div>

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

    <div class="hidden lg:block fixed left-0 bottom-0 pointer-events-none select-none z-10 leading-none">
      <img 
        src="/987.png" 
        alt="Character Illustration" 
        class="h-[85vh] max-h-[750px] w-auto object-contain object-left-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] block"
      />
    </div>

    <div class="w-full max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-20 flex flex-col lg:flex-row items-center justify-between gap-8 flex-grow">
      <div class="hidden lg:block w-5/12"></div>

      <main class="w-full lg:w-6/12 max-w-lg flex flex-col justify-center my-auto z-20 lg:ml-auto lg:mr-8">
        <div v-if="loading" class="bg-white text-black p-8 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mb-4"></div>
          <p class="font-bold uppercase tracking-wider text-sm">Menghubungkan ke Server Anime Online...</p>
        </div>

        <div v-else-if="errorMessage" class="bg-red-600 text-white p-6 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <p class="font-bold uppercase text-sm mb-4">{{ errorMessage }}</p>
          <button @click="fetchPopularCharacters" class="bg-white text-black px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-neutral-200">
            Coba Lagi
          </button>
        </div>

        <div v-else class="bg-white text-black p-6 border-2 border-black w-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
          <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black"></div>
          <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-black"></div>
          <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-black"></div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black"></div>

          <div class="flex justify-center mb-6">
            <div class="w-48 h-64 bg-neutral-900 border-4 border-black overflow-hidden relative flex items-center justify-center shadow-inner">
              <div v-if="!isImageReady" class="absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-500 z-10">
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              </div>

              <img 
                :key="currentCharacter?.id"
                :src="currentCharacter?.image" 
                :alt="currentCharacter?.fullName" 
                @load="handleImageLoad"
                class="w-full h-full object-cover select-none pointer-events-none"
                :style="imageBlurStyle"
              />
              <div v-if="!isWon && !isGameOver" class="absolute bottom-2 right-2 bg-black text-white text-[10px] px-2 py-1 font-bold tracking-wider z-20">
                BURAM: {{ clueLevel === 1 ? 'TINGGI' : clueLevel === 2 ? 'SEDANG' : clueLevel === 3 ? 'RENDAH' : 'JELAS' }}
              </div>
            </div>
          </div>

          <div 
            v-if="feedbackMessage" 
            class="mb-4 p-3 border-2 border-black font-bold text-sm uppercase flex items-center justify-center gap-2"
            :class="isWon ? 'bg-emerald-500 text-white' : isGameOver ? 'bg-red-600 text-white' : 'bg-yellow-300 text-black'"
          >
            <svg v-if="isWon" class="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <svg v-else-if="isGameOver" class="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
            <svg v-else class="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            <span>{{ feedbackMessage }}</span>
          </div>

          <div v-if="isWon || isGameOver" class="text-center mb-6 bg-neutral-100 p-4 border-2 border-black">
            <span class="text-xs text-neutral-500 font-sans block uppercase font-bold">Jawaban Yang Benar:</span>
            <h2 class="text-2xl font-bold uppercase tracking-widest text-red-600">{{ currentCharacter?.fullName }}</h2>
            <p class="text-xs text-neutral-700 font-sans mt-1">Anime: <strong>{{ currentCharacter?.animeTitle }}</strong></p>
            
            <button 
              @click="startNewRound" 
              class="mt-4 w-full bg-black text-white py-3 border-2 border-black hover:bg-emerald-600 transition-colors uppercase font-bold tracking-widest cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Karakter Selanjutnya</span>
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M5 13h11.86l-5.43 5.43L13 20l8-8-8-8-1.43 1.43L16.86 11H5v2z"/></svg>
            </button>
          </div>

          <form v-else @submit.prevent="submitGuess" class="mb-6 flex gap-2">
            <input 
              v-model="userGuess" 
              type="text" 
              placeholder="Ketik nama karakter di sini..." 
              class="flex-grow bg-neutral-100 border-2 border-black p-3 text-sm md:text-base font-sans font-semibold text-black focus:outline-none focus:bg-white"
              :disabled="isWon || isGameOver"
            />
            <button 
              type="submit" 
              class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 border-2 border-black font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg class="w-4 h-4 fill-current hidden sm:block" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <span>Tebak</span>
            </button>
          </form>

          <div class="border-t-2 border-black pt-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-bold text-sm uppercase flex items-center gap-1.5 text-black">
                <svg class="w-4 h-4 fill-current text-black" viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
                <span>Petunjuk (Tingkat {{ clueLevel }}/4)</span>
              </h3>
              <button 
                v-if="clueLevel < 4 && !isWon && !isGameOver" 
                @click="unlockNextClue" 
                class="text-xs bg-neutral-200 hover:bg-black hover:text-white px-2 py-1 border border-black font-bold transition-all cursor-pointer flex items-center gap-1 text-black"
              >
                <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                <span>Buka Petunjuk</span>
              </button>
            </div>

            <ul class="space-y-2 font-sans text-xs md:text-sm text-black">
              <li class="p-2 border border-neutral-300 bg-neutral-50 flex items-center gap-2">
                <span class="font-bold bg-black text-white px-2 py-0.5 text-[10px] tracking-wider shrink-0">PETUNJUK 1</span>
                <span>Jenis Kelamin: <strong>{{ currentCharacter?.gender }}</strong></span>
              </li>

              <li v-if="clueLevel >= 2" class="p-2 border border-neutral-300 bg-neutral-50 flex items-center gap-2">
                <span class="font-bold bg-black text-white px-2 py-0.5 text-[10px] tracking-wider shrink-0">PETUNJUK 2</span>
                <span>Asal Anime: <strong>{{ currentCharacter?.animeTitle }}</strong> ({{ currentCharacter?.role }})</span>
              </li>

              <li v-if="clueLevel >= 3" class="p-2 border border-neutral-300 bg-neutral-50 flex items-start gap-2">
                <span class="font-bold bg-black text-white px-2 py-0.5 text-[10px] tracking-wider shrink-0 mt-0.5">PETUNJUK 3</span>
                <span class="italic text-neutral-700">"{{ censoredDescription }}"</span>
              </li>
            </ul>
          </div>

        </div>

      </main>

    </div>
    
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