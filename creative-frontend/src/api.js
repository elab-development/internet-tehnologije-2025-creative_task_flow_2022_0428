import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

//helper fja za nase tokene, da uvek koristimo bearer token ako ga ima
export function setAuthToken(token) {
  if (token) {
    // Ako token postoji, dodajemo Authorization header da backend (Sanctum) prepozna korisnika.
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    // Ako token ne postoji, brišemo header da ne šaljemo stari/invalid token.
    delete api.defaults.headers.common.Authorization;
  }
}

//ako imamo response, setujemo poruku, ako nema podataka, stavljamo default poruku
export function extractErrorMessage(err) {
  const data = err?.response?.data;
  if (!data) return "Došlo je do greške.";
  if (data.message) return data.message;

  // Ako backend šalje errors po poljima (validacija), uzimamo prvu poruku iz prvog polja.
  const firstKey = data.errors && Object.keys(data.errors)[0];
  if (firstKey && data.errors[firstKey]?.[0]) return data.errors[firstKey][0];

  return "Došlo je do greške.";
}
