"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import type { PhotoUploadResult } from "./api";

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => api.fetchSession(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      password,
      snakeDraft = false,
    }: {
      title: string;
      password: string;
      snakeDraft?: boolean;
    }) => api.createSession(title, password, snakeDraft),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useUploadPhotos(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results: PhotoUploadResult[] = [];
      for (const file of files) {
        const result = await api.uploadPhoto(sessionId, file);
        results.push(result);
      }
      return results;
    },
    mutationKey: ["upload", sessionId],
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useDeletePhoto(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => api.deletePhoto(sessionId, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useAddPlayer(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.addPlayer(sessionId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useRemovePlayer(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => api.removePlayer(sessionId, playerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useStartDraft(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.startDraft(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useSkipTurn(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.skipTurn(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function usePickPhoto(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => api.pickPhoto(sessionId, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useReorderPhotos(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoIds: string[]) => api.reorderPhotos(sessionId, photoIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useReturnPhoto(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => api.returnPhoto(sessionId, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useResumeDraft(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resumeDraft(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useResetDraft(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetDraft(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useVerifyAdmin(sessionId: string) {
  return useMutation({
    mutationFn: (password: string) => api.verifyAdmin(sessionId, password),
  });
}
