"use client";

import { useActionState } from "react";
import { saveLearningProfileAction } from "@/lib/actions/students";
import type { ActionState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ProfileQuestionWithOptions } from "@/types/database";

/**
 * El formulario no está hardcodeado: se arma con lo que hay en
 * profile_questions y profile_options. Cada grupo de radios se llama como el
 * uuid de su pregunta, que es lo que la server action espera.
 */
export function LearningProfileForm({
  studentId,
  questions,
  initial = {},
}: {
  studentId: string;
  questions: ProfileQuestionWithOptions[];
  initial?: Record<string, string>;
}) {
  const [state, action] = useActionState(saveLearningProfileAction, {} as ActionState);

  if (!questions.length) {
    return <p className="muted mt-7">No hay preguntas de perfil cargadas. Pide al coordinador que las registre antes de continuar.</p>;
  }

  return <form action={action} className="mt-7 grid gap-6">
    <input type="hidden" name="studentId" value={studentId}/>
    {questions.map((question) => (
      <fieldset className="card p-6 sm:p-8" key={question.id}>
        <legend className="label mb-3">{question.question}</legend>
        {question.help_text && <p className="muted mb-3 text-xs">{question.help_text}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <label className="choice" key={option.id}>
              <input defaultChecked={initial[question.id] === option.id} name={question.id} required type="radio" value={option.id}/>
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    ))}
    <FormMessage state={state}/>
    <SubmitButton>Guardar perfil de aprendizaje</SubmitButton>
  </form>;
}
