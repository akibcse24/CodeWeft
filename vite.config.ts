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
    "https://ukboercbnitgrhpflcbb.supabase.co";

  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_fZLUqKUhk1N2f8aoq-fIXw_yu6jhHqH";

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

