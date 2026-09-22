<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
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
        <div class="bg-white text-black p-8 border-2 border-black w-full text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative">
          <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-black"></div>
          <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-black"></div>
          <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-black"></div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-black"></div>

          <div class="w-12 h-12 bg-black text-white mx-auto mb-4 flex items-center justify-center text-xl uppercase font-bold">
            ◆
          </div>

          <h2 class="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2 text-red-600">
            Tes Kecocokan
          </h2>

          <p class="font-sans text-neutral-600 font-semibold text-sm md:text-base mb-6">
            Segera Hadir!
          </p>

          <div class="inline-block bg-neutral-100 border-2 border-black px-4 py-2 font-sans text-xs text-neutral-700 font-bold uppercase tracking-widest">
            Fitur Sedang Dalam Pengembangan
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