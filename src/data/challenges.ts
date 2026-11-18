import type { ChallengeTemplate, ChallengeType } from '../types/game';

interface SentenceEntry {
  sentence: string;
  targetWords: string[];
}

export const INFORMATIKA_SENTENCES: SentenceEntry[] = [
  {
    sentence: 'Komputer membantu pekerjaan manusia.',
    targetWords: ['Komputer', 'membantu', 'pekerjaan', 'manusia'],
  },
  {
    sentence: 'Mouse digunakan untuk menggerakkan kursor.',
    targetWords: ['Mouse', 'digunakan', 'menggerakkan', 'kursor'],
  },
  {
    sentence: 'Internet menghubungkan banyak komputer.',
    targetWords: ['Internet', 'menghubungkan', 'banyak', 'komputer'],
  },
  {
    sentence: 'Siswa belajar mengetik di laboratorium.',
    targetWords: ['Siswa', 'belajar', 'mengetik', 'laboratorium'],
  },
  {
    sentence: 'Monitor menampilkan gambar dan tulisan.',
    targetWords: ['Monitor', 'menampilkan', 'gambar', 'tulisan'],
  },
  {
    sentence: 'Printer dipakai untuk mencetak dokumen.',
    targetWords: ['Printer', 'dipakai', 'mencetak', 'dokumen'],
  },
  {
    sentence: 'Aplikasi Word dipakai untuk menulis laporan.',
    targetWords: ['Aplikasi', 'dipakai', 'menulis', 'laporan'],
  },
  {
    sentence: 'Data disimpan di dalam flashdisk.',
    targetWords: ['Data', 'disimpan', 'dalam', 'flashdisk'],
  },
  {
    sentence: 'Keyboard adalah alat untuk mengetik huruf.',
    targetWords: ['Keyboard', 'alat', 'mengetik', 'huruf'],
  },
  {
    sentence: 'Algoritma adalah langkah menyelesaikan masalah.',
    targetWords: ['Algoritma', 'langkah', 'menyelesaikan', 'masalah'],
  },
  {
    sentence: 'Peramban web membuka halaman situs belajar.',
    targetWords: ['Peramban', 'membuka', 'halaman', 'belajar'],
  },
  {
    sentence: 'Folder berguna untuk merapikan berkas tugas.',
    targetWords: ['Folder', 'berguna', 'merapikan', 'berkas'],
  },
  {
    sentence: 'Kata sandi yang kuat melindungi akun pribadi.',
    targetWords: ['sandi', 'kuat', 'melindungi', 'pribadi'],
  },
  {
    sentence: 'Sistem operasi mengatur kerja perangkat keras.',
    targetWords: ['Sistem', 'operasi', 'mengatur', 'perangkat'],
  },
  {
    sentence: 'Presentasi digital dibuat menggunakan aplikasi slide.',
    targetWords: ['Presentasi', 'digital', 'dibuat', 'aplikasi'],
  },
  {
    sentence: 'Spreadsheet memudahkan pengolahan angka dalam tabel.',
    targetWords: ['Spreadsheet', 'memudahkan', 'pengolahan', 'tabel'],
  },
  {
    sentence: 'Jaringan lokal menghubungkan komputer di sekolah.',
    targetWords: ['Jaringan', 'lokal', 'menghubungkan', 'sekolah'],
  },
  {
    sentence: 'Tombol Ctrl dan C menyalin teks yang diblok.',
    targetWords: ['Tombol', 'menyalin', 'teks', 'diblok'],
  },
  {
    sentence: 'Tombol Ctrl dan V menempel hasil salinan teks.',
    targetWords: ['menempel', 'hasil', 'salinan', 'teks'],
  },
  {
    sentence: 'Etika digital menjaga sopan santun saat daring.',
    targetWords: ['Etika', 'digital', 'menjaga', 'daring'],
  },
  {
    sentence: 'Speaker mengeluarkan suara dari sistem komputer.',
    targetWords: ['Speaker', 'mengeluarkan', 'suara', 'sistem'],
  },
  {
    sentence: 'Cadangan file mencegah hilangnya tugas sekolah.',
    targetWords: ['Cadangan', 'mencegah', 'hilangnya', 'tugas'],
  },
];

export const INFORMATIKA_PARAGRAPHS: string[] = [
  'Komputer memiliki banyak bagian. Ada monitor, keyboard, dan mouse. Semua bagian bekerja sama dengan baik.',
  'Internet sangat bermanfaat. Kita dapat belajar dan mencari informasi. Gunakan internet dengan bijak.',
  'Menyalin adalah membuat salinan teks. Menempel adalah menaruh teks ke tempat baru. Keduanya sering dipakai saat mengetik.',
  'Menjaga data itu penting. Simpan file di tempat yang aman. Buat cadangan agar tidak hilang.',
  'Keyboard memiliki tombol huruf dan angka. Ada juga tombol pintasan seperti Ctrl. Pintasan membuat kerja mengetik lebih cepat.',
  'Algoritma berisi langkah yang berurutan. Setiap langkah harus jelas dan teratur. Komputer menjalankan perintah sesuai urutan itu.',
  'Etika digital perlu diterapkan setiap hari. Hormati karya milik orang lain. Jangan menyebarkan informasi yang belum jelas.',
  'Laboratorium komputer harus selalu bersih. Rapikan kursi dan mouse setelah selesai belajar. Matikan komputer dengan prosedur yang benar.',
];

// Deterministic PRNG so every player in the room gets the exact same challenge sequence
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getAllowedTypesForLevel(level: number): ChallengeType[] {
  if (level <= 1) {
    return ['BLOK_KATA', 'BLOK_KALIMAT'];
  }
  if (level === 2) {
    return ['BLOK_KATA', 'BLOK_KALIMAT', 'COPY'];
  }
  if (level === 3) {
    return ['BLOK_KATA', 'BLOK_KALIMAT', 'COPY', 'BLOK_PARAGRAF'];
  }
  return ['BLOK_KATA', 'BLOK_KALIMAT', 'COPY', 'BLOK_PARAGRAF', 'COPY_PASTE'];
}

export function generateChallengeForIndex(
  seed: number,
  level: number,
  index: number
): ChallengeTemplate {
  const rng = mulberry32(seed + level * 1009 + index * 97);
  const allowed = getAllowedTypesForLevel(level);
  // Ensure progressive exposure on early cards of new levels
  let type = allowed[Math.floor(rng() * allowed.length)];
  if (level === 2 && index % 3 === 1) type = 'COPY';
  if (level === 3 && index % 4 === 2) type = 'BLOK_PARAGRAF';
  if (level >= 4 && index % 4 === 3) type = 'COPY_PASTE';

  if (type === 'BLOK_KATA') {
    const item = INFORMATIKA_SENTENCES[Math.floor(rng() * INFORMATIKA_SENTENCES.length)];
    const target = item.targetWords[Math.floor(rng() * item.targetWords.length)];
    return {
      type: 'BLOK_KATA',
      title: 'BLOK KATA',
      instruction: 'Double-click kata yang diminta.',
      text: item.sentence,
      target,
    };
  }

  if (type === 'BLOK_KALIMAT') {
    const firstIdx = Math.floor(rng() * INFORMATIKA_SENTENCES.length);
    const secondIdx = (firstIdx + 1 + Math.floor(rng() * 5)) % INFORMATIKA_SENTENCES.length;
    const s1 = INFORMATIKA_SENTENCES[firstIdx].sentence;
    const s2 = INFORMATIKA_SENTENCES[secondIdx].sentence;
    const pickFirst = rng() < 0.5;
    const target = pickFirst ? s1 : s2;
    return {
      type: 'BLOK_KALIMAT',
      title: 'BLOK KALIMAT',
      instruction: 'Blok seluruh kalimat yang diminta.',
      text: `${s1} ${s2}`,
      target,
      contextSentences: [s1, s2],
    };
  }

  if (type === 'COPY') {
    const item = INFORMATIKA_SENTENCES[Math.floor(rng() * INFORMATIKA_SENTENCES.length)];
    const target = item.targetWords[Math.floor(rng() * item.targetWords.length)];
    return {
      type: 'COPY',
      title: 'COPY',
      instruction: 'Blok kata target, lalu tekan Ctrl+C atau klik kanan → Copy.',
      text: item.sentence,
      target,
    };
  }

  if (type === 'BLOK_PARAGRAF') {
    const paragraph =
      INFORMATIKA_PARAGRAPHS[Math.floor(rng() * INFORMATIKA_PARAGRAPHS.length)];
    return {
      type: 'BLOK_PARAGRAF',
      title: 'BLOK PARAGRAF',
      instruction: 'Blok seluruh paragraf dari kata pertama hingga tanda titik terakhir.',
      text: paragraph,
      target: paragraph,
    };
  }

  // COPY_PASTE
  const item = INFORMATIKA_SENTENCES[Math.floor(rng() * INFORMATIKA_SENTENCES.length)];
  const target = item.targetWords[Math.floor(rng() * item.targetWords.length)];
  return {
    type: 'COPY_PASTE',
    title: 'COPY + PASTE',
    instruction: '1. Blok kata target  2. Copy (Ctrl+C)  3. Paste (Ctrl+V) ke kotak jawaban.',
    text: item.sentence,
    target,
  };
}

export function getLevelSpeedAndInterval(level: number): {
  speedPxPerSec: number;
  spawnIntervalMs: number;
  maxActiveCards: number;
} {
  if (level <= 1) {
    return { speedPxPerSec: 21, spawnIntervalMs: 5200, maxActiveCards: 3 };
  }
  if (level === 2) {
    return { speedPxPerSec: 26, spawnIntervalMs: 4600, maxActiveCards: 3 };
  }
  if (level === 3) {
    return { speedPxPerSec: 31, spawnIntervalMs: 4000, maxActiveCards: 4 };
  }
  const extra = level - 4;
  return {
    speedPxPerSec: Math.min(56, 35 + extra * 5),
    spawnIntervalMs: Math.max(2500, 3600 - extra * 250),
    maxActiveCards: 4,
  };
}
