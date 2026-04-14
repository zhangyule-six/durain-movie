import { useRequest } from "./http";

export interface GroupOwner {
  _id: string;
  username: string;
  avatar?: string;
}

export interface GroupItem {
  _id: string;
  name: string;
  description: string;
  owner: GroupOwner;
  memberCount: number;
  maxMembers: number;
  tags: string[];
  joined?: boolean;
  createdAt: string;
}

export interface GroupMessageItem {
  _id: string;
  group: string;
  sender: GroupOwner;
  content: string;
  messageType: "text" | "system";
  createdAt: string;
}

export interface MyGroupsResponse {
  items: GroupItem[];
}

export function useListGroups(params: { q?: string; page?: number; limit?: number }) {
  return useRequest<{ items: GroupItem[]; pagination: { page: number; limit: number; total: number } }, typeof params>({
    url: "/api/groups",
    method: "GET",
    body: params,
  });
}

export function useCreateGroup(payload: { name: string; description?: string; tags?: string[] }) {
  return useRequest<GroupItem, typeof payload>({
    url: "/api/groups",
    method: "POST",
    body: payload,
  });
}

export function useMyGroups() {
  return useRequest<MyGroupsResponse, undefined>({
    url: "/api/groups/mine",
    method: "GET",
  });
}

export function useJoinGroup(groupId: string) {
  return useRequest<GroupItem, undefined>({
    url: `/api/groups/${groupId}/join`,
    method: "POST",
  });
}

export function useGetGroupDetail(groupId: string) {
  return useRequest<GroupItem & { joined: boolean; membersPreview?: GroupOwner[] }, undefined>({
    url: `/api/groups/${groupId}`,
    method: "GET",
  });
}

export function useListGroupMessages(groupId: string, page = 1, limit = 30) {
  return useRequest<{ items: GroupMessageItem[]; pagination: { page: number; limit: number; total: number } }, undefined>({
    url: `/api/groups/${groupId}/messages?page=${page}&limit=${limit}`,
    method: "GET",
  });
}

export function useSendGroupMessage(groupId: string, content: string) {
  return useRequest<GroupMessageItem, { content: string }>({
    url: `/api/groups/${groupId}/messages`,
    method: "POST",
    body: { content },
  });
}
