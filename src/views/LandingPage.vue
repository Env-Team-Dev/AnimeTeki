<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const selectGame = (mode) => {
  if (mode === 'Tebak Karakter Anime') {
    router.push('/tebak-karakter-anime')
  } else if (mode === 'Tes Kecocokan') {
    router.push('/tes-kecocokan')
  } else if (mode === 'Who Is It?') {
    router.push('/who-is-it')
  }
}
</script>

<template>
  <div 
    class="min-h-screen bg-neutral-950 text-slate-200 font-['Mangat'] relative flex flex-col justify-between selection:bg-red-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden"
    style="background-image: url('/bg.png');"
  >
    <div class="fixed inset-0 pointer-events-none bg-neutral-950/40 z-0"></div>

    <header class="absolute top-6 right-8 md:right-16 z-30 pointer-events-auto">
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

    <div class="w-full max-w-7xl mx-auto px-6 pt-32 pb-8 relative z-20 flex flex-col lg:flex-row items-center justify-between gap-8 flex-grow">
      
      <div class="hidden lg:block w-5/12"></div>

      <main class="w-full lg:w-6/12 max-w-lg flex flex-col justify-center my-auto z-20 lg:ml-auto lg:mr-8">
        
        <div class="text-center lg:text-left mb-6">
          <p class="text-slate-100 text-sm md:text-base tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Pilih mode game di bawah dan mulai tes pengetahuan anime kamu!
          </p>
        </div>

        <div class="flex flex-col gap-5 w-full">
          
          <div 
            @click="selectGame('Tebak Karakter Anime')"
            class="group relative bg-white text-black p-4 md:p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(239,68,68,0.8),0_0_50px_rgba(220,38,38,0.4)]"
          >
            <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black group-hover:border-red-600 transition-colors"></div>

            <div class="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/20 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none animate-pulse"></div>

            <div class="relative z-10 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-black text-white group-hover:bg-red-600 transition-colors flex items-center justify-center text-xs uppercase tracking-tighter">
                  ◆
                </div>
                <div>
                  <h2 class="text-lg md:text-xl uppercase tracking-wider text-black group-hover:text-red-600 transition-colors">
                    Tebak Karakter Anime
                  </h2>
                  <p class="text-xs text-neutral-600 group-hover:text-neutral-900">
                    Uji pengetahuan trivia seputar karakter anime favoritmu.
                  </p>
                </div>
              </div>

              <span class="text-xl text-black group-hover:text-red-600 transition-all transform group-hover:translate-x-1">
                ▶
              </span>
            </div>
          </div>

          <div 
            @click="selectGame('Tes Kecocokan')"
            class="group relative bg-white text-black p-4 md:p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(239,68,68,0.8),0_0_50px_rgba(220,38,38,0.4)]"
          >
            <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black group-hover:border-red-600 transition-colors"></div>

            <div class="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/20 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none animate-pulse"></div>

            <div class="relative z-10 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-black text-white group-hover:bg-red-600 transition-colors flex items-center justify-center text-xs uppercase tracking-tighter">
                  ◆
                </div>
                <div>
                  <h2 class="text-lg md:text-xl uppercase tracking-wider text-black group-hover:text-red-600 transition-colors">
                    Tes Kecocokan
                  </h2>
                  <p class="text-xs text-neutral-600 group-hover:text-neutral-900">
                    Cari tahu karakter anime mana yang paling pas sama kamu.
                  </p>
                </div>
              </div>

              <span class="text-xl text-black group-hover:text-red-600 transition-all transform group-hover:translate-x-1">
                ▶
              </span>
            </div>
          </div>

          <div 
            @click="selectGame('Who Is It?')"
            class="group relative bg-white text-black p-4 md:p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(239,68,68,0.8),0_0_50px_rgba(220,38,38,0.4)]"
          >
            <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-black group-hover:border-red-600 transition-colors"></div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black group-hover:border-red-600 transition-colors"></div>

            <div class="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/20 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none animate-pulse"></div>

            <div class="relative z-10 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-black text-white group-hover:bg-red-600 transition-colors flex items-center justify-center text-xs uppercase tracking-tighter">
                  ◆
                </div>
                <div>
                  <h2 class="text-lg md:text-xl uppercase tracking-wider text-black group-hover:text-red-600 transition-colors">
                    Who Is It?
                  </h2>
                  <p class="text-xs text-neutral-600 group-hover:text-neutral-900">
                    Tebak karakter dari siluet atau potongan gambar.
                  </p>
                </div>
              </div>

              <span class="text-xl text-black group-hover:text-red-600 transition-all transform group-hover:translate-x-1">
                ▶
              </span>
            </div>
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