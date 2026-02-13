import { useState } from "react";
import { api, extractErrorMessage } from "../api";

export default function use0x0Upload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lastUrl, setLastUrl] = useState("");

  const upload = async (file) => {
    setError("");
    setLastUrl("");

    if (!file) {
      setError("Nije izabran fajl.");
      return null;
    }

    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await api.post("/specialist/uploads/0x0", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res?.data?.data?.url || "";
      if (!url.startsWith("http")) throw new Error("Neispravan URL.");

      setLastUrl(url);
      return url;
    } catch (e) {
      setError(extractErrorMessage(e));
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error, lastUrl };
}
