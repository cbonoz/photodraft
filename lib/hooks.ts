"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

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
    mutationFn: ({ title, password }: { title: string; password: string }) =>
      api.createSession(title, password),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useUploadPhotos(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => api.uploadPhotos(sessionId, files),
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
