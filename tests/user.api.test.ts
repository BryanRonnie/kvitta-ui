import { describe, it, expect, mock } from "bun:test";
import type { AxiosResponse } from "axios";
import { api } from "@/api/axios";
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
} from "@/api/user.api";

const axiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {},
});

describe("User API", () => {
  it("createUser", async () => {
    const postMock = mock(async () =>
      axiosResponse({ _id: "1", name: "A" })
    ) as unknown as typeof api.post;

    api.post = postMock;

    const result = await createUser({
      name: "A",
      email: "a@test.com",
      password: "123",
    });

    expect(postMock).toHaveBeenCalledWith("/users", {
      name: "A",
      email: "a@test.com",
      password: "123",
    });

    expect(result._id).toBe("1");
  });

  it("getUserById", async () => {
    const getMock = mock(async () =>
      axiosResponse({ _id: "1" })
    ) as unknown as typeof api.get;

    api.get = getMock;

    await getUserById("1");

    expect(getMock).toHaveBeenCalledWith("/users/1");
  });

  it("getUserByEmail", async () => {
    const getMock = mock(async () =>
      axiosResponse({ _id: "1" })
    ) as unknown as typeof api.get;

    api.get = getMock;

    await getUserByEmail("a@test.com");

    expect(getMock).toHaveBeenCalledWith("/users/email/a@test.com");
  });

  it("updateUser", async () => {
    const patchMock = mock(async () =>
      axiosResponse({ _id: "1", name: "B" })
    ) as unknown as typeof api.patch;

    api.patch = patchMock;

    await updateUser("1", { name: "B" });

    expect(patchMock).toHaveBeenCalledWith("/users/1", { name: "B" });
  });

  it("deleteUser", async () => {
    const delMock = mock(async () =>
      axiosResponse({ success: true })
    ) as unknown as typeof api.delete;

    api.delete = delMock;

    const res = await deleteUser("1");

    expect(delMock).toHaveBeenCalledWith("/users/1");
    expect(res).toBe(true);
  });
});