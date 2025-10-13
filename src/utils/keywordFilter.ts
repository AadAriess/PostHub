const BANNED_WORDS: string[] = [
  // 1. Kata-kata kasar (Contoh, ganti dengan kata yang relevan di bahasa Anda)
  "bodoh",
  "gila",
  "tolol",
  "bego",
  "brengsek",

  // 2. Tautan dan Promosi Spam (Mendeteksi tautan atau ajakan promosi)
  "http://",
  "https://",
  ".com",
  ".net",
  ".xyz",
  "beli sekarang",
  "promosi gratis",
  "diskon besar",
  "klik disini",

  // 3. Konten dewasa/terlarang
  "porn",
  "seks",
  "telanjang",
  "narkoba",
  "judi",

  // 4. Ancaman atau ujaran kebencian
  "bunuh",
  "benci",
  "mati saja",
  "teroris",
  "rasis",

  // 5. Informasi pribadi yang sensitif
  "nomor telepon",
  "nomor rekening",
  "alamat rumah",
  "kartu kredit",

  // 6. Kata-kata yang memicu moderasi tambahan
  "admin",
  "moderator",
];

export const isContentSpam = (content: string): boolean => {
  const normalizedContent = content.toLowerCase();

  // Cek apakah konten mengandung salah satu kata terlarang
  return BANNED_WORDS.some((word) => normalizedContent.includes(word));
};
