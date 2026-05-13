"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAgentConfig, getAgentScript, getAnalytics, getCall, listCalls, getKnowledgeBase,
  listMembers, getOrganization, getRecordingUrl, getSession,
  listLeads, getLead, bulkUpdateLeads, deleteLeads, importLeads,
  listCampaigns, getCampaign, createCampaign, updateCampaignStatus,
  previewAudience, listAgents, getCampaignStats, getDashboard,
  updateAgentConfig, updateAgentScript, aiRewriteSection, listVoiceOptions,
  listAgentVersions, saveAgentVersion, restoreAgentVersion, runTestCall,
  updateKnowledgeBase, aiSuggestObjections, aiSuggestFaqs, extractKbProductsFromFile,
  listCrmRules, updateCrmRules, listSegmentSchedules, updateSegmentSchedules,
  listRetryPolicies, updateRetryPolicies,
  listInbox, getInboxCounts, updateInboxItem, bulkUpdateInbox,
  type AgentConfigPatch, type KnowledgeBasePatch, type InboxQuery,
  type CallsQuery, type LeadsQuery, type NewCampaign, type ImportOptions,
  type RangeKey,
} from "@/lib/mock";
import type {
  CrmMappingRule, InboxItem, Lead, RetryPolicyRule, ScriptSectionKey, SegmentScheduleRule,
} from "@/lib/mock";
import { queryKeys } from "@/lib/query/keys";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: getSession,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
  });
}

export function useOrganization() {
  const session = useSession();
  const orgId = session.data?.user.organizationId ?? undefined;
  return useQuery({
    queryKey: queryKeys.organization(orgId ?? ""),
    queryFn: () => getOrganization(orgId as string),
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });
}

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members(),
    queryFn: listMembers,
    staleTime: 60_000,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics(),
    queryFn: getAnalytics,
  });
}

export function useCalls(query: CallsQuery) {
  return useQuery({
    queryKey: queryKeys.calls(query),
    queryFn: () => listCalls(query),
    placeholderData: keepPreviousData,
  });
}

export function useCall(id: string | null) {
  return useQuery({
    queryKey: queryKeys.call(id ?? ""),
    queryFn: () => getCall(id as string),
    enabled: !!id,
  });
}

export function useRecording(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.recording(id ?? ""),
    queryFn: () => getRecordingUrl(id as string).then((r) => r.url),
    enabled: !!id && enabled,
    retry: false,
  });
}

export function useAgentConfig() {
  return useQuery({
    queryKey: queryKeys.agent(),
    queryFn: getAgentConfig,
    staleTime: 60_000,
  });
}

export function useKnowledgeBase() {
  const session = useSession();
  const orgId = session.data?.user.organizationId ?? undefined;
  return useQuery({
    queryKey: queryKeys.knowledgeBase(),
    queryFn: () => getKnowledgeBase(orgId as string),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useDashboard(range: RangeKey) {
  return useQuery({
    queryKey: ["xylo", "dashboard", range],
    queryFn: () => getDashboard(range),
    staleTime: 30_000,
  });
}

export function useLeads(query: LeadsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.leads(query),
    queryFn: () => listLeads(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: queryKeys.lead(id ?? ""),
    queryFn: () => getLead(id as string),
    enabled: !!id,
  });
}

export function useBulkUpdateLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      patch,
    }: {
      ids: string[];
      patch: Partial<Pick<Lead, "campaignId" | "status" | "notes">>;
    }) => bulkUpdateLeads(ids, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["xylo", "leads"] });
    },
  });
}

export function useDeleteLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteLeads(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["xylo", "leads"] });
    },
  });
}

export function useImportLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rows,
      mapping,
      options,
    }: {
      rows: Array<Record<string, string>>;
      mapping: Record<string, string>;
      options: ImportOptions;
    }) => importLeads(rows, mapping, options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["xylo", "leads"] });
    },
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: queryKeys.campaigns(),
    queryFn: listCampaigns,
    staleTime: 60_000,
  });
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: queryKeys.campaign(id ?? ""),
    queryFn: () => getCampaign(id as string),
    enabled: !!id,
  });
}

export function useCampaignStats(id: string | null) {
  return useQuery({
    queryKey: queryKeys.campaignStats(id ?? ""),
    queryFn: () => getCampaignStats(id as string),
    enabled: !!id,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents(),
    queryFn: listAgents,
    staleTime: 60_000,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCampaign) => createCampaign(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["xylo", "campaigns"] });
      qc.invalidateQueries({ queryKey: ["xylo", "leads"] });
    },
  });
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "draft" | "active" | "paused" | "completed";
    }) => updateCampaignStatus(id, status),
    onSuccess: (cmp) => {
      qc.invalidateQueries({ queryKey: ["xylo", "campaigns"] });
      qc.invalidateQueries({ queryKey: queryKeys.campaign(cmp.id) });
    },
  });
}

export function useAgentScript() {
  return useQuery({
    queryKey: queryKeys.agentScript(),
    queryFn: getAgentScript,
    staleTime: 60_000,
  });
}

export function useVoiceOptions() {
  return useQuery({
    queryKey: queryKeys.voiceOptions(),
    queryFn: listVoiceOptions,
    staleTime: 5 * 60_000,
  });
}

export function useAgentVersions() {
  return useQuery({
    queryKey: queryKeys.agentVersions(),
    queryFn: listAgentVersions,
    staleTime: 30_000,
  });
}

export function useUpdateAgentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: AgentConfigPatch) => updateAgentConfig(patch),
    onSuccess: (cfg) => {
      qc.setQueryData(queryKeys.agent(), cfg);
    },
  });
}

export function useUpdateAgentScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ section, value }: { section: ScriptSectionKey; value: string }) =>
      updateAgentScript(section, value),
    onSuccess: (script) => {
      qc.setQueryData(queryKeys.agentScript(), script);
    },
  });
}

export function useAiRewriteSection() {
  return useMutation({
    mutationFn: (section: ScriptSectionKey) => aiRewriteSection(section),
  });
}

export function useSaveAgentVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => saveAgentVersion(note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agentVersions() });
    },
  });
}

export function useRestoreAgentVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreAgentVersion(id),
    onSuccess: ({ config, script }) => {
      qc.setQueryData(queryKeys.agent(), config);
      qc.setQueryData(queryKeys.agentScript(), script);
    },
  });
}

export function useRunTestCall() {
  return useMutation({
    mutationFn: (phone: string) => runTestCall(phone),
  });
}

export function useUpdateKnowledgeBase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: KnowledgeBasePatch) => updateKnowledgeBase(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.knowledgeBase() });
      const prev = qc.getQueryData(queryKeys.knowledgeBase());
      qc.setQueryData(queryKeys.knowledgeBase(), (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...(old as object), ...patch };
      });
      return { prev };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.knowledgeBase(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.knowledgeBase() });
    },
  });
}

export function useAiSuggestObjections() {
  return useMutation({ mutationFn: () => aiSuggestObjections() });
}

export function useAiSuggestFaqs() {
  return useMutation({ mutationFn: () => aiSuggestFaqs() });
}

export function useExtractKbProducts() {
  return useMutation({
    mutationFn: (filename: string) => extractKbProductsFromFile(filename),
  });
}

// Workflows.

export function useCrmRules() {
  return useQuery({ queryKey: queryKeys.crmRules(), queryFn: listCrmRules, staleTime: 60_000 });
}
export function useSegmentSchedules() {
  return useQuery({ queryKey: queryKeys.segmentSchedules(), queryFn: listSegmentSchedules, staleTime: 60_000 });
}
export function useRetryPolicies() {
  return useQuery({ queryKey: queryKeys.retryPolicies(), queryFn: listRetryPolicies, staleTime: 60_000 });
}
export function useUpdateCrmRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: CrmMappingRule[]) => updateCrmRules(next),
    onSuccess: (next) => qc.setQueryData(queryKeys.crmRules(), next),
  });
}
export function useUpdateSegmentSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: SegmentScheduleRule[]) => updateSegmentSchedules(next),
    onSuccess: (next) => qc.setQueryData(queryKeys.segmentSchedules(), next),
  });
}
export function useUpdateRetryPolicies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: RetryPolicyRule[]) => updateRetryPolicies(next),
    onSuccess: (next) => qc.setQueryData(queryKeys.retryPolicies(), next),
  });
}

// Inbox.

export function useInbox(query: InboxQuery = {}) {
  return useQuery({
    queryKey: queryKeys.inbox(query),
    queryFn: () => listInbox(query),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
export function useInboxCounts() {
  return useQuery({
    queryKey: queryKeys.inboxCounts(),
    queryFn: getInboxCounts,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
export function useUpdateInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<InboxItem, "status" | "assigneeEmail">> }) =>
      updateInboxItem(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["xylo", "inbox"] });
    },
  });
}
export function useBulkUpdateInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, patch }: { ids: string[]; patch: Partial<Pick<InboxItem, "status" | "assigneeEmail">> }) =>
      bulkUpdateInbox(ids, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["xylo", "inbox"] });
    },
  });
}

export function usePreviewAudience() {
  return useMutation({
    mutationFn: (filter: NewCampaign["audienceFilter"]) => previewAudience(filter),
  });
}
