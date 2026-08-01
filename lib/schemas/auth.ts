import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(8, "Usa al menos 8 caracteres.").max(72),
});

export const educatorProfileSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(80),
});
