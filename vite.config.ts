import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  // Hardcode the values from the uploaded .env so builds always work
  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    "https://zysbkswyoxnlwahkbruf.supabase.co";

  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c2Jrc3d5b3hubHdhaGticnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDY1OTAsImV4cCI6MjA4NTc4MjU5MH0.yOfKlFnOkHKlJ-IsNxk38RiAJKAtKeOnOFB-aG_XLsA";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseKey),
    },
  };
});

