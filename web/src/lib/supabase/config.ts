// Referências literais a process.env.NEXT_PUBLIC_*: o Next só embute as variáveis escritas assim.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !chavePublica) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Veja web/.env.example.",
  );
}

export const supabaseUrl = url;
export const supabaseChavePublica = chavePublica;
