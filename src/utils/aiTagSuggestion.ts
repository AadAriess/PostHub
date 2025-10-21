import fetch from "node-fetch";

/**
 * Mengambil saran tag berdasarkan isi konten post.
 */
export async function getSuggestedTags(content: string): Promise<string[]> {
  const HF_API_URL =
    "https://api-inference.huggingface.co/models/ml6team/keyphrase-extraction-kbir-inspec";

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: content }),
    });

    const result = await response.json();

    // Model mengembalikan array kata kunci
    if (Array.isArray(result) && result.length > 0) {
      // Ambil hanya nama tag-nya
      return result.map((item: any) => item.word || item);
    } else {
      console.warn("Hugging Face tidak mengembalikan tag:", result);
      return [];
    }
  } catch (error) {
    console.error("Gagal mengambil saran tag:", error);
    return [];
  }
}
