import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { getStoreName } from "@lib/util/site"

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: `Inicia sesión en tu cuenta de ${getStoreName()}.`,
}

export default function Login() {
  return <LoginTemplate />
}
