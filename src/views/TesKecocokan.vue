<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const mode = ref('menu') // menu, quiz, calc, result, loading
const subMode = ref('') // 'quiz' or 'calc'

const isLoadingData = ref(false)
const characterPool = ref([])

const goBack = () => {
  if (mode.value === 'menu') {
    router.push('/')
  } else {
    mode.value = 'menu'
    resetGame()
  }
}

// Character definitions
const characterConfigs = [
  { id: 40, type: 'energetic', desc: 'Kamu punya energi yang tak terbatas dan tekad baja untuk menggapai mimpi!' }, // Luffy
  { id: 17, type: 'energetic', desc: 'Semangat pantang menyerahmu menginspirasi semua orang di sekitarmu.' }, // Naruto
  { id: 126077, type: 'energetic', desc: 'Meskipun kadang penakut, saat terdesak kekuatanmu meledak luar biasa!' }, // Zenitsu
  { id: 71, type: 'smart', desc: 'Kecerdasanmu di atas rata-rata, kamu selalu menganalisis sebelum melangkah.' }, // L
  { id: 4172, type: 'smart', desc: 'Kamu adalah ahli strategi yang mampu mengubah dunia dengan pemikiranmu.' }, // Lelouch
  { id: 40884, type: 'smart', desc: 'Kamu percaya bahwa pengetahuan adalah senjata terkuat dalam menghadapi konflik.' }, // Armin
  { id: 323, type: 'calm', desc: 'Kamu sangat santai dan jenius, bagimu kerumitan adalah hal yang merepotkan.' }, // Shikamaru
  { id: 126076, type: 'calm', desc: 'Ketegasan dan ketenanganmu dalam situasi sulit sangat mengagumkan.' }, // Giyu Tomioka
  { id: 111813, type: 'calm', desc: 'Kamu dingin di luar, tapi sebenarnya sangat peduli dengan orang terdekatmu.' }, // Todoroki
  { id: 62, type: 'strong', desc: 'Disiplin dan kekuatan fisikmu adalah hasil dari kerja keras yang luar biasa.' }, // Zoro
  { id: 40881, type: 'strong', desc: 'Kesetiaan dan kekuatanmu adalah tameng terbaik bagi orang-orang tersayang.' }, // Mikasa
  { id: 89344, type: 'strong', desc: 'Kamu memiliki kemauan yang keras dan tidak takut menghadapi rintangan apapun.' }, // Erza Scarlet
  { id: 156, type: 'mysterious', desc: 'Kamu penuh rahasia dan rela berkorban demi tujuan yang lebih besar.' }, // Itachi
  { id: 45627, type: 'mysterious', desc: 'Ketajaman insting dan aura dinginmu membuatmu dihormati sekaligus ditakuti.' }, // Levi
  { id: 127691, type: 'mysterious', desc: 'Kamu adalah yang terkuat, dengan kepribadian yang sulit ditebak dan karismatik.' } // Gojo
]

const fetchCharacterDetails = async () => {
  isLoadingData.value = true
  const ids = characterConfigs.map(c => c.id)
  
  try {
    const query = `
      query ($ids: [Int]) {
        Page(perPage: 50) {
          characters(id_in: $ids) {
            id
            name { full }
            image { large }
          }
        }
      }
    `
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { ids } })
    })
    
    if (res.ok) {
      const data = await res.json()
      const fetchedChars = data.data.Page.characters
      
      characterPool.value = characterConfigs.map(config => {
        const details = fetchedChars.find(f => f.id === config.id)
        return {
          ...config,
          name: details?.name.full || 'Karakter Anime',
          img: details?.image.large || 'https://via.placeholder.com/300x400'
        }
      })
    }
  } catch (e) {
    console.error("Gagal memuat data karakter:", e)
  } finally {
    isLoadingData.value = false
  }
}

// Logic Quiz
const currentQuestionIndex = ref(0)
const quizScore = ref({ energetic: 0, calm: 0, smart: 0, strong: 0, mysterious: 0 })

const questions = [
  { text: "Apa suasana tempat tinggal idamanmu?", options: [{ text: "Kota besar yang ramai", type: "energetic" }, { text: "Perpustakaan tua sunyi", type: "smart" }, { text: "Pondok tenang pinggir danau", type: "calm" }, { text: "Dojo tempat latihan keras", type: "strong" }, { text: "Tempat tersembunyi tak diketahui", type: "mysterious" }] },
  { text: "Saat melihat teman dalam kesulitan, apa reaksimu?", options: [{ text: "Langsung lari menolong", type: "energetic" }, { text: "Menyusun rencana matang", type: "smart" }, { text: "Tetap tenang & beri dukungan", type: "calm" }, { text: "Hadapi siapapun pengganggunya", type: "strong" }, { text: "Membantu dari balik layar", type: "mysterious" }] },
  { text: "Apa senjata pilihanmu dalam pertempuran?", options: [{ text: "Tangan kosong / Tekad baja", type: "energetic" }, { text: "Buku sihir / Teknologi", type: "smart" }, { text: "Pedang tunggal presisi", type: "calm" }, { text: "Pedang besar / Senjata berat", type: "strong" }, { text: "Kekuatan gelap / Siluman", type: "mysterious" }] },
  { text: "Apa yang paling kamu hargai dalam hidup?", options: [{ text: "Kebebasan & Petualangan", type: "energetic" }, { text: "Kebenaran & Pengetahuan", type: "smart" }, { text: "Kedamaian & Harmoni", type: "calm" }, { text: "Kehormatan & Kekuatan", type: "strong" }, { text: "Keadilan Mutlak", type: "mysterious" }] },
  { text: "Bagaimana perasaanmu tentang aturan?", options: [{ text: "Aturan dibuat untuk dilanggar!", type: "energetic" }, { text: "Harus logis, jika tidak ya diubah", type: "smart" }, { text: "Ikuti jika menjaga ketenangan", type: "calm" }, { text: "Disiplin adalah segalanya", type: "strong" }, { text: "Saya punya aturan sendiri", type: "mysterious" }] },
  { text: "Apa ketakutan terbesarmu?", options: [{ text: "Kesepian & Kebosanan", type: "energetic" }, { text: "Kegagalan kurang persiapan", type: "smart" }, { text: "Kehilangan kedamaian batin", type: "calm" }, { text: "Menjadi lemah tak berdaya", type: "strong" }, { text: "Rahasia terbongkar", type: "mysterious" }] },
  { text: "Warna yang paling menggambarkan jiwamu?", options: [{ text: "Oranye / Kuning Terang", type: "energetic" }, { text: "Biru Tua / Silver", type: "smart" }, { text: "Hijau / Biru Langit", type: "calm" }, { text: "Merah Darah / Hitam", type: "strong" }, { text: "Ungu Gelap / Putih", type: "mysterious" }] },
  { text: "Apa hobi yang paling menarik?", options: [{ text: "Eksplorasi tempat baru", type: "energetic" }, { text: "Catur / Teka-teki sulit", type: "smart" }, { text: "Memandangi awan / Memancing", type: "calm" }, { text: "Latihan beban / Bela diri", type: "strong" }, { text: "Mempelajari hal mistis", type: "mysterious" }] },
  { text: "Jika kamu bisa mengubah dunia, apa yang kamu lakukan?", options: [{ text: "Buat semua orang tertawa bebas", type: "energetic" }, { text: "Hapus kebodohan", type: "smart" }, { text: "Hentikan peperangan", type: "calm" }, { text: "Ciptakan tatanan kuat & adil", type: "strong" }, { text: "Jadi pelindung dari bayang-bayang", type: "mysterious" }] },
  { text: "Apa motto hidupmu?", options: [{ text: "Hiduplah seolah besok tiada!", type: "energetic" }, { text: "Pengetahuan adalah kekuatan", type: "smart" }, { text: "Aliran air menemukan jalannya", type: "calm" }, { text: "Mati terhormat atau hidup kalah", type: "strong" }, { text: "Kegelapan melindungi cahaya", type: "mysterious" }] }
]

const resultCharacter = ref(null)

const selectOption = (type) => {
  quizScore.value[type]++
  if (currentQuestionIndex.value < questions.length - 1) {
    currentQuestionIndex.value++
  } else {
    calculateQuizResult()
  }
}

const calculateQuizResult = () => {
  let highestScore = -1
  let winnerType = 'energetic'
  for (const type in quizScore.value) {
    if (quizScore.value[type] > highestScore) {
      highestScore = quizScore.value[type]
      winnerType = type
    }
  }
  const matchingChars = characterPool.value.filter(c => c.type === winnerType)
  resultCharacter.value = matchingChars[Math.floor(Math.random() * matchingChars.length)] || characterPool.value[0]
  mode.value = 'result'
  subMode.value = 'quiz'
}

// Logic Calculator
const userName = ref('')
const animeCharName = ref('')
const calcResult = ref(0)
const isCalculating = ref(false)
const calcCharacter = ref(null)

const calculateCompatibility = async () => {
  if (!userName.value || !animeCharName.value) return
  isCalculating.value = true
  calcCharacter.value = null
  
  // Search character on AniList
  try {
    const query = `
      query ($search: String) {
        Character(search: $search) {
          name { full }
          image { large }
        }
      }
    `
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: animeCharName.value } })
    })
    if (res.ok) {
      const data = await res.json()
      if (data.data.Character) {
        calcCharacter.value = {
          name: data.data.Character.name.full,
          img: data.data.Character.image.large
        }
      }
    }
  } catch (e) { console.error(e) }

  setTimeout(() => {
    const combined = (userName.value + animeCharName.value).toLowerCase()
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash)
    }
    calcResult.value = Math.abs(hash % 41) + 60
    isCalculating.value = false
    mode.value = 'result'
    subMode.value = 'calc'
  }, 1200)
}

const resetGame = () => {
  currentQuestionIndex.value = 0
  quizScore.value = { energetic: 0, calm: 0, smart: 0, strong: 0, mysterious: 0 }
  userName.value = ''
  animeCharName.value = ''
  calcCharacter.value = null
}

const getCompatibilityMessage = (score) => {
  if (score > 90) return "Pasangan Sejati! Takdir tak terpisahkan."
  if (score > 80) return "Sangat Cocok! Chemistry luar biasa."
  if (score > 70) return "Cukup Serasi. Butuh sedikit usaha!"
  return "Teman baik. Mungkin ada yang lebih baik?"
}

onMounted(() => fetchCharacterDetails())
</script>

<template>
  <div 
    class="min-h-screen bg-neutral-950 text-slate-200 font-['Mangat'] relative flex flex-col justify-between selection:bg-red-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed overflow-x-hidden"
    style="background-image: url('/bg.png');"
  >
    <div class="fixed inset-0 pointer-events-none bg-neutral-950/40 z-0"></div>

    <header class="absolute top-6 right-8 md:right-16 z-30 pointer-events-auto flex items-center gap-4">
      <button @click="goBack" class="bg-white text-black px-4 py-2 border-2 border-black hover:bg-red-600 hover:text-white transition-all font-bold cursor-pointer text-sm md:text-base flex items-center gap-2 shadow-lg">
        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Kembali
      </button>
      <img src="/AnimeTeki.svg" alt="AnimeTeki" class="h-20 md:h-32 w-auto object-contain drop-shadow-[0_12px_28px_rgba(220,38,38,0.45)]" />
    </header>

    <div class="hidden lg:block fixed left-0 bottom-0 pointer-events-none select-none z-10 leading-none">
      <img src="/987.png" alt="Character Illustration" class="h-[85vh] max-h-[750px] w-auto object-contain object-left-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] block" />
    </div>

    <div class="w-full max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-20 flex flex-col lg:flex-row items-center justify-between gap-8 flex-grow">
      <div class="hidden lg:block w-5/12"></div>

      <main class="w-full lg:w-6/12 max-w-lg flex flex-col justify-center my-auto z-20 lg:ml-auto lg:mr-8">
        
        <div v-if="isLoadingData" class="bg-white text-black p-8 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mb-4"></div>
          <p class="font-bold uppercase tracking-wider text-sm">Menghubungkan ke Database Karakter...</p>
        </div>

        <div v-else-if="mode === 'menu'" class="space-y-6">
          <div class="bg-white text-black p-8 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
            <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black"></div>
            <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-black"></div>
            <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-black"></div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black"></div>
            <h2 class="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2 text-red-600">Tes Kecocokan</h2>
            <p class="text-xs font-sans font-bold text-neutral-500 mb-6 uppercase tracking-widest">Cari tahu takdir animemu di sini</p>
            <div class="flex flex-col gap-4">
              <button @click="mode = 'quiz'" class="group relative bg-black text-white p-4 border-2 border-black hover:bg-red-600 transition-all font-bold uppercase tracking-widest text-sm flex items-center justify-between">
                <div class="flex items-center gap-3"><span>📋</span><span>Kuis Kepribadian</span></div>
                <span class="group-hover:translate-x-1 transition-transform">▶</span>
              </button>
              <button @click="mode = 'calc'" class="group relative bg-black text-white p-4 border-2 border-black hover:bg-emerald-600 transition-all font-bold uppercase tracking-widest text-sm flex items-center justify-between">
                <div class="flex items-center gap-3"><span>⚖️</span><span>Kalkulator Kecocokan</span></div>
                <span class="group-hover:translate-x-1 transition-transform">▶</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="mode === 'quiz'" class="bg-white text-black p-6 border-2 border-black w-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
          <div class="mb-4 flex justify-between items-center border-b-2 border-black pb-2">
            <span class="text-xs font-bold uppercase tracking-widest">Pertanyaan {{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
            <div class="h-2 w-24 bg-neutral-200 border border-black overflow-hidden">
              <div class="h-full bg-red-600 transition-all duration-300" :style="{ width: ((currentQuestionIndex + 1) / questions.length) * 100 + '%' }"></div>
            </div>
          </div>
          <h3 class="text-lg font-bold mb-6 min-h-[3.5rem] leading-tight">{{ questions[currentQuestionIndex].text }}</h3>
          <div class="space-y-2">
            <button v-for="(opt, idx) in questions[currentQuestionIndex].options" :key="idx" @click="selectOption(opt.type)" class="w-full text-left p-3 border-2 border-black hover:bg-neutral-100 font-sans font-semibold transition-colors flex items-center gap-3 group text-sm">
              <span class="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] group-hover:bg-red-600 transition-colors shrink-0">{{ String.fromCharCode(65 + idx) }}</span>
              {{ opt.text }}
            </button>
          </div>
        </div>

        <div v-else-if="mode === 'calc'" class="bg-white text-black p-8 border-2 border-black w-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
          <h2 class="text-2xl font-bold uppercase tracking-wider mb-6 text-center text-red-600">Cek Kecocokan Nama</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-bold uppercase mb-1">Nama Kamu</label>
              <input v-model="userName" type="text" placeholder="Masukkan namamu..." class="w-full bg-neutral-100 border-2 border-black p-3 font-sans font-bold focus:outline-none focus:bg-white" />
            </div>
            <div class="flex justify-center py-2"><div class="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">VS</div></div>
            <div>
              <label class="block text-[10px] font-bold uppercase mb-1">Nama Karakter Anime</label>
              <input v-model="animeCharName" type="text" placeholder="Misal: Hinata, Mikasa..." class="w-full bg-neutral-100 border-2 border-black p-3 font-sans font-bold focus:outline-none focus:bg-white" />
            </div>
            <button @click="calculateCompatibility" :disabled="isCalculating || !userName || !animeCharName" class="w-full bg-red-600 text-white py-4 border-2 border-black font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
              <span v-if="isCalculating" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              {{ isCalculating ? 'MENGHUBUNGKAN TAKDIR...' : 'CEK SEKARANG' }}
            </button>
          </div>
        </div>

        <div v-else-if="mode === 'result'" class="bg-white text-black p-8 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div v-if="subMode === 'quiz'">
            <p class="text-[10px] font-bold uppercase tracking-[0.3em] mb-4 text-neutral-500">Karakter Yang Cocok Denganmu</p>
            <div class="w-48 h-60 mx-auto mb-5 border-4 border-black overflow-hidden bg-neutral-900 shadow-2xl relative">
              <img :src="resultCharacter?.img" class="w-full h-full object-cover" />
              <div class="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-white backdrop-blur-sm">{{ resultCharacter?.name }}</div>
            </div>
            <h2 class="text-3xl font-bold uppercase text-red-600 mb-2 leading-none">{{ resultCharacter?.name }}</h2>
            <div class="inline-block bg-black text-white px-3 py-1 text-[10px] uppercase font-bold tracking-widest mb-4">Tipe: {{ resultCharacter?.type }}</div>
            <p class="font-sans text-sm font-semibold text-neutral-700 mb-8 px-2 italic">"{{ resultCharacter?.desc }}"</p>
          </div>
          
          <div v-else-if="subMode === 'calc'">
            <div class="flex flex-col items-center gap-6 mb-8 mt-2">
              <div class="flex items-center gap-4 w-full justify-center">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-24 h-24 bg-neutral-200 border-4 border-black flex items-center justify-center text-4xl shadow-lg relative">
                    👤
                    <div class="absolute -bottom-3 bg-black text-white text-[10px] px-2 py-0.5 font-bold uppercase truncate max-w-[80px]">{{ userName }}</div>
                  </div>
                </div>
                <div class="text-red-600 text-3xl animate-pulse">❤</div>
                <div class="flex flex-col items-center gap-2">
                  <div class="w-24 h-24 bg-neutral-200 border-4 border-black overflow-hidden shadow-lg relative flex items-center justify-center">
                    <img v-if="calcCharacter?.img" :src="calcCharacter.img" class="w-full h-full object-cover" />
                    <span v-else class="text-4xl">❓</span>
                    <div class="absolute -bottom-3 bg-black text-white text-[10px] px-2 py-0.5 font-bold uppercase truncate max-w-[80px]">{{ calcCharacter?.name || animeCharName }}</div>
                  </div>
                </div>
              </div>
              <div class="relative">
                <div class="text-8xl font-black text-black leading-none italic outline-4 drop-shadow-[4px_4px_0_rgba(220,38,38,1)]">{{ calcResult }}%</div>
              </div>
              <p class="font-sans text-xs font-bold uppercase text-neutral-600 tracking-wider max-w-xs">{{ getCompatibilityMessage(calcResult) }}</p>
            </div>
          </div>
          
          <button @click="mode = 'menu'; resetGame()" class="w-full bg-black text-white py-4 border-2 border-black hover:bg-neutral-800 transition-all uppercase font-bold tracking-widest text-sm">Kembali</button>
        </div>

      </main>
    </div>

    <footer class="fixed bottom-6 right-8 md:right-16 z-30 flex flex-col items-end gap-1.5 pointer-events-auto">
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-slate-200 uppercase tracking-widest font-semibold">Built by</span>
        <div class="flex items-center gap-1.5">
          <img src="/dev/1.png" alt="Dev 1" class="w-7 h-7 rounded-full object-cover border border-neutral-400" />
          <img src="/dev/2.png" alt="Dev 2" class="w-7 h-7 rounded-full object-cover border border-neutral-400" />
        </div>
      </div>
      <p class="text-[11px] text-slate-100 font-semibold">&copy; 2026 EnvTeam</p>
    </footer>
  </div>
</template>