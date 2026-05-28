/**
 * Domínio institucional usado para compor o e-mail interno do Supabase Auth.
 * Decisão registrada em Apoio/_decisoes.md (DT-001).
 *
 * O usuário digita apenas o login institucional (ex.: "admin", "cad.silva")
 * e o sistema completa com este sufixo antes de chamar signInWithPassword.
 * NÃO é usado para envio de e-mail real — "Confirm email" e "Magic link"
 * permanecem DESLIGADOS no provider Supabase.
 */
export const INSTITUTIONAL_EMAIL_DOMAIN = "abm.br";
