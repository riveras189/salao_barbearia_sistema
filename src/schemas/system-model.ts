import { z } from "zod";

export const switchSystemModelSchema = z.object({
  modelId: z.string().min(1, "ID do modelo é obrigatório"),
  scope: z.enum(["user", "company"]).default("user"),
  confirm: z.boolean().optional(),
});

export type SwitchSystemModelInput = z.infer<typeof switchSystemModelSchema>;
