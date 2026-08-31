import { usuariosAPI, type Usuario } from "../services/api";

/**
 * Verifica se o usuário pode editar/excluir
 */
export function podeEditar(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return usuario.permissao === "Admin" || usuario.permissao === "Editor";
}

/**
 * Verifica se o usuário é admin
 */
export function isAdmin(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return usuario.permissao === "Admin";
}

/**
 * Verifica se tem usuários cadastrados
 */
export async function temUsuarios(): Promise<boolean> {
  try {
    const usuarios = await usuariosAPI.listar();
    return usuarios.length > 0;
  } catch (error) {
    console.error("Erro ao verificar usuários:", error);
    return false;
  }
}

/**
 * Autentica usuário com código e senha
 */
export async function autenticarUsuario(
  codigo: string,
  senha: string
): Promise<Usuario | null> {
  try {
    const usuarios = await usuariosAPI.listar();
    const usuario = usuarios.find(
      (u) => u.codigo === codigo && u.senha === senha
    );
    return usuario || null;
  } catch (error) {
    console.error("Erro ao autenticar:", error);
    return null;
  }
}
