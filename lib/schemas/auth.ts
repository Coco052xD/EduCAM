import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(8, "Usa al menos 8 caracteres.").max(72),
});

export const educatorProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  gradesTaught: z.array(z.string().min(1)).min(1),
  subjectsTaught: z.array(z.string().min(1)).min(1),
});
