import { useCallback, useEffect, useState } from "react";

/**
 * usePexelsImages.
 * - Dohvata slike sa Pexels Search API-ja na osnovu query-ja.
 * - "Refresh" vraća novi set tako što menja `page` (jer isti query bez page-a vraća iste prve rezultate).
 */
export default function usePexelsImages({
  apiKey,
  query = "marketing branding social media",
  perPage = 3,
  maxPage = 30, // sigurnosni limit za random paginaciju
} = {}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1); // trenutna strana rezultata (bitno za "novi set")

  // Glavna funkcija koja zove Pexels API i mapira rezultat u format pogodan za UI.
  const fetchImages = useCallback(
    async (nextPage = page) => {
      setLoading(true);
      setError("");

      try {
        const url = new URL("https://api.pexels.com/v1/search");
        url.searchParams.set("query", query);
        url.searchParams.set("per_page", String(perPage));
        url.searchParams.set("orientation", "landscape");
        url.searchParams.set("page", String(nextPage)); // ključna stvar: menja set slika

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: { Authorization: apiKey },
          cache: "no-store", // izbegava keširanje identičnog GET zahteva
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Pexels greška (${res.status}): ${text}`);
        }

        const data = await res.json();
        const photos = data?.photos || [];

        // Mapiranje: čuvamo samo ono što nam treba za prikaz.
        const mapped = photos.map((p) => ({
          id: p.id,
          alt: p.alt || "Pexels image",
          photographer: p.photographer || "",
          url: p.url || "",
          src: {
            small: p?.src?.small,
            medium: p?.src?.medium,
            large: p?.src?.large,
          },
        }));

        setImages(mapped);
      } catch (e) {
        setError(e?.message || "Došlo je do greške pri učitavanju slika.");
        setImages([]);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, query, perPage, page]
  );

  // Refresh: bira random page (različit od prethodnog) i time dobija novi set slika.
  const refresh = useCallback(() => {
    setPage((prev) => {
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * maxPage) + 1;
      }
      fetchImages(next);
      return next;
    });
  }, [fetchImages, maxPage]);

  // Inicijalno učitavanje (kad postoji apiKey): uzima prvu stranu rezultata.
  useEffect(() => {
    if (!apiKey) {
      setError("Nedostaje Pexels API ključ.");
      return;
    }
    fetchImages(1);
  }, [apiKey, fetchImages]);

  return { images, loading, error, refresh };
}
