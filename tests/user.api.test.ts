import type { AxiosResponse } from "axios";
import { api } from "../src/api";
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
} from "../src/api/user.api";
import { describe, it, expect, vi, beforeEach } from "vitest";

const axiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as any,
});

describe("User API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createUser", async () => {
    const postSpy = vi
      .spyOn(api, "post")
      .mockResolvedValue(
        axiosResponse({ _id: "1", name: "A" })
      );

    const result = await createUser({
      name: "A",
      email: "a@test.com",
      password: "123",
    });

    expect(postSpy).toHaveBeenCalledWith("/users", {
      name: "A",
      email: "a@test.com",
      password: "123",
    });

    expect(result._id).toBe("1");
  });

  it("getUserById", async () => {
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValue(axiosResponse({ _id: "1" }));

    await getUserById("1");

    expect(getSpy).toHaveBeenCalledWith("/users/1");
  });

  it("getUserByEmail", async () => {
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValue(axiosResponse({ _id: "1" }));

    await getUserByEmail("a@test.com");

    expect(getSpy).toHaveBeenCalledWith(
      "/users/email/a@test.com"
    );
  });

  it("updateUser", async () => {
    const patchSpy = vi
      .spyOn(api, "patch")
      .mockResolvedValue(
        axiosResponse({ _id: "1", name: "B" })
      );

    await updateUser("1", { name: "B" });

    expect(patchSpy).toHaveBeenCalledWith(
      "/users/1",
      { name: "B" }
    );
  });

  it("deleteUser", async () => {
    const deleteSpy = vi
      .spyOn(api, "delete")
      .mockResolvedValue(
        axiosResponse({ success: true })
      );

    const res = await deleteUser("1");

    expect(deleteSpy).toHaveBeenCalledWith("/users/1");
    expect(res).toBe(true);
  });
});