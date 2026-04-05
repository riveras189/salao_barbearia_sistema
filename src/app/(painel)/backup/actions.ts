"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  createBackup,
  deleteBackup,
  restoreSavedBackup,
  restoreUploadedSql,
} from "@/lib/backup";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado.";
}

export async function createBackupAction() {
  await requireUser();

  let errorMessage = "";

  try {
    await createBackup();
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }

  revalidatePath("/backup");

  if (errorMessage) {
    redirect(`/backup?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/backup?ok=created");
}

export async function restoreSavedBackupAction(formData: FormData) {
  await requireUser();

  const name = String(formData.get("name") || "");
  let errorMessage = "";

  try {
    await restoreSavedBackup(name);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }

  revalidatePath("/backup");

  if (errorMessage) {
    redirect(`/backup?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/backup?ok=restored");
}

export async function restoreUploadedSqlAction(formData: FormData) {
  await requireUser();

  const file = formData.get("arquivo");
  let errorMessage = "";

  try {
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Selecione um arquivo .sql para restaurar.");
    }

    await restoreUploadedSql(file);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }

  revalidatePath("/backup");

  if (errorMessage) {
    redirect(`/backup?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/backup?ok=restored-upload");
}

export async function deleteBackupAction(formData: FormData) {
  await requireUser();

  const name = String(formData.get("name") || "");
  let errorMessage = "";

  try {
    await deleteBackup(name);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }

  revalidatePath("/backup");

  if (errorMessage) {
    redirect(`/backup?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/backup?ok=deleted");
}