import type { AxiosResponse } from "axios";
import { api } from "../src/api";
import {
  createReceipt,
  getReceipt,
  listReceipts,
  updateReceipt,
  addMember,
  removeMember,
  getMembers,
  finalizeReceipt,
} from "../src/api/receipt.api";
import { describe, it, expect, vi, beforeEach } from "vitest";

const axiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as any,
});

describe("Receipt API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createReceipt", async () => {
    const postSpy = vi
      .spyOn(api, "post")
      .mockResolvedValue(axiosResponse({ _id: "1" }));

    await createReceipt({ title: "Dinner" });

    expect(postSpy).toHaveBeenCalledWith("/receipts", {
      title: "Dinner",
    });
  });

  it("getReceipt", async () => {
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValue(axiosResponse({ _id: "1" }));

    await getReceipt("1");

    expect(getSpy).toHaveBeenCalledWith("/receipts/1");
  });

  it("listReceipts", async () => {
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValue(axiosResponse([]));

    await listReceipts();

    expect(getSpy).toHaveBeenCalledWith("/receipts");
  });

  it("updateReceipt sends version", async () => {
    const patchSpy = vi
      .spyOn(api, "patch")
      .mockResolvedValue(
        axiosResponse({ _id: "1", version: 2 })
      );

    await updateReceipt("1", { version: 1 });

    expect(patchSpy).toHaveBeenCalledWith(
      "/receipts/1",
      { version: 1 }
    );
  });

  it("addMember", async () => {
    const postSpy = vi
      .spyOn(api, "post")
      .mockResolvedValue(axiosResponse({}));

    await addMember("1", "user2");

    expect(postSpy).toHaveBeenCalledWith(
      "/receipts/1/members",
      { user_id: "user2" }
    );
  });

  it("removeMember", async () => {
    const deleteSpy = vi
      .spyOn(api, "delete")
      .mockResolvedValue(axiosResponse({}));

    await removeMember("1", "user2");

    expect(deleteSpy).toHaveBeenCalledWith(
      "/receipts/1/members/user2"
    );
  });

  it("getMembers", async () => {
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValue(axiosResponse([]));

    await getMembers("1");

    expect(getSpy).toHaveBeenCalledWith(
      "/receipts/1/members"
    );
  });

  it("finalizeReceipt", async () => {
    const postSpy = vi
      .spyOn(api, "post")
      .mockResolvedValue(
        axiosResponse({ receipt: {}, ledger_entries: [] })
      );

    await finalizeReceipt("1");

    expect(postSpy).toHaveBeenCalledWith(
      "/receipts/1/finalize"
    );
  });
});