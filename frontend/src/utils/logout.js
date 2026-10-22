
import { apiRequest } from "./api";

export async function logoutUser() {
  await apiRequest("/api/auth/logout", {
    method: "POST",
  });
}
