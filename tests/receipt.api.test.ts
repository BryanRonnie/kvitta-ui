import { describe, it, expect, mock } from "bun:test";
import type { AxiosResponse } from "axios";
import { api } from "@/api/axios";
import {
  createReceipt,
  getReceipt,
  listReceipts,
  updateReceipt,
  addMember,
  removeMember,
  getMembers,
  finalizeReceipt,
} from "@/api/receipt.api";

const axiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {},
});

describe("Receipt API", () => {
  it("createReceipt", async () => {
    api.post = mock(async () =>
      axiosResponse({ _id: "1" })
    ) as unknown as typeof api.post;

    await createReceipt({ title: "Dinner" });

    expect(api.post).toHaveBeenCalledWith("/receipts", {
      title: "Dinner",
    });
  });

  it("getReceipt", async () => {
    api.get = mock(async () =>
      axiosResponse({ _id: "1" })
    ) as unknown as typeof api.get;

    await getReceipt("1");

    expect(api.get).toHaveBeenCalledWith("/receipts/1");
  });

  it("listReceipts", async () => {
    api.get = mock(async () =>
      axiosResponse([])
    ) as unknown as typeof api.get;

    await listReceipts();

    expect(api.get).toHaveBeenCalledWith("/receipts");
  });

  it("updateReceipt sends version", async () => {
    api.patch = mock(async () =>
      axiosResponse({ _id: "1", version: 2 })
    ) as unknown as typeof api.patch;

    await updateReceipt("1", { version: 1 });

    expect(api.patch).toHaveBeenCalledWith("/receipts/1", {
      version: 1,
    });
  });

  it("addMember", async () => {
    api.post = mock(async () =>
      axiosResponse({})
    ) as unknown as typeof api.post;

    await addMember("1", "user2");

    expect(api.post).toHaveBeenCalledWith(
      "/receipts/1/members",
      { user_id: "user2" }
    );
  });

  it("removeMember", async () => {
    api.delete = mock(async () =>
      axiosResponse({})
    ) as unknown as typeof api.delete;

    await removeMember("1", "user2");

    expect(api.delete).toHaveBeenCalledWith(
      "/receipts/1/members/user2"
    );
  });

  it("getMembers", async () => {
    api.get = mock(async () =>
      axiosResponse([])
    ) as unknown as typeof api.get;

    await getMembers("1");

    expect(api.get).toHaveBeenCalledWith(
      "/receipts/1/members"
    );
  });

  it("finalizeReceipt", async () => {
    api.post = mock(async () =>
      axiosResponse({ receipt: {}, ledger_entries: [] })
    ) as unknown as typeof api.post;

    await finalizeReceipt("1");

    expect(api.post).toHaveBeenCalledWith(
      "/receipts/1/finalize"
    );
  });
});