// Nombre público de la tienda. La marca final la define el dueño del negocio
// (pendiente, ver tasks.md del change mvp-ropa); mientras tanto la UI muestra
// un descriptor neutro y honesto, nunca una marca inventada.
export function getStoreName(): string {
  const name = process.env.NEXT_PUBLIC_STORE_NAME?.trim()
  return name && name.length > 0 ? name : "Tienda"
}
