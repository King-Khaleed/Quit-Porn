import { getSupabase } from "./supabase";

export async function signInAnonymously() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function getSession() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function registerPasskey() {
  if (!("PublicKeyCredential" in window)) {
    throw new Error("WebAuthn not supported in this browser");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "QuitPorn", id: window.location.hostname },
      user: {
        id: userId,
        name: `anon-${Array.from(userId).slice(0, 4).join("")}`,
        displayName: "QuitPorn User",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "preferred",
      },
      timeout: 60000,
    },
  }) as PublicKeyCredential;

  return credential;
}

export async function authenticateWithPasskey() {
  if (!("PublicKeyCredential" in window)) {
    throw new Error("WebAuthn not supported in this browser");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      userVerification: "preferred",
      timeout: 60000,
    },
  }) as PublicKeyCredential;

  return credential;
}
