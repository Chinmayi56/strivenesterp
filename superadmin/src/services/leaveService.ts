import api from "./api";

export const getAllLeaves = async () => {
  const response = await api.get("/leaves");
  return response.data;
};

export const getPendingLeaves = async () => {
  const response = await api.get("/leaves/pending");
  return response.data;
};

export const approveLeave = async (id: string) => {
  const response = await api.put(`/leaves/${id}/approve`);
  return response.data;
};

export const rejectLeave = async (id: string) => {
  const response = await api.put(`/leaves/${id}/reject`);
  return response.data;
};

export const getLeaveStatistics = async () => {
  const response = await api.get("/leaves/statistics");
  return response.data;
};