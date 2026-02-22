import type { AxiosResponse } from "axios";
import { api } from "../src/api";
import {
  getLedgerByReceipt,
  getUserBalance,
  settleLedgerEntry,
  deleteLedgerForReceipt,
} from "../src/api/ledger.api";
import { describe, it, expect, vi, beforeEach } from "vitest";

const axiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as any,
});

describe("Ledger API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getLedgerByReceipt", async () => {
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValue(axiosResponse([]));

    await getLedgerByReceipt("1");

    expect(getSpy).toHaveBeenCalledWith(
      "/ledger/receipt/1"
    );
  });

  it("getUserBalance", async () => {
    const getSpy = vi
      .spyOn(api, "get")
      .mockResolvedValue(axiosResponse({ net_cents: 0 }));

    await getUserBalance("u1");

    expect(getSpy).toHaveBeenCalledWith(
      "/ledger/user/u1/balance"
    );
  });

  it("settleLedgerEntry", async () => {
    const postSpy = vi
      .spyOn(api, "post")
      .mockResolvedValue(axiosResponse({}));

    await settleLedgerEntry("e1", 500);

    expect(postSpy).toHaveBeenCalledWith(
      "/ledger/e1/settle",
      { amount_cents: 500 }
    );
  });

  it("deleteLedgerForReceipt", async () => {
    const deleteSpy = vi
      .spyOn(api, "delete")
      .mockResolvedValue(
        axiosResponse({ deleted_count: 1 })
      );

    await deleteLedgerForReceipt("1");

    expect(deleteSpy).toHaveBeenCalledWith(
      "/ledger/receipt/1"
    );
  });
});