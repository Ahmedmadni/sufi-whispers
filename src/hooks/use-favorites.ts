import { useEffect, useState } from "react";

const KEY = "jnf-favorites";

export function useFavorites() {
  const [favs, setFavs] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setFavs(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: number[]) => {
    setFavs(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const toggle = (id: number) => {
    save(favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]);
  };

  return { favs, toggle, isFav: (id: number) => favs.includes(id) };
}
