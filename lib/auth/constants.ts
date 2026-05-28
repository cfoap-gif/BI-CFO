/**
 * Domínio técnico fictício usado para compor o e-mail interno do Supabase Auth.
 * Decisão registrada em Apoio/_decisoes.md (DT-001).
 *
 * O usuário digita apenas o login institucional (ex.: "admin", "cad.silva")
 * e o sistema completa com este sufixo antes de chamar signInWithPassword.
 * NÃO é usado para envio de e-mail real.
 */
export const INSTITUTIONAL_EMAIL_DOMAIN = "bi-cfo.local";
