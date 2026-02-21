import { describe, it, expect, mock } from "bun:test";
import type { AxiosResponse } from "axios";
import { api } from "@/api/axios";
import {
  getLedgerByReceipt,
  getUserBalance,
  settleLedgerEntry,
  deleteLedgerForReceipt,
} from "@/api/ledger.api";

const axiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {},
});

describe("Ledger API", () => {
  it("getLedgerByReceipt", async () => {
    api.get = mock(async () =>
      axiosResponse([])
    ) as unknown as typeof api.get;

    await getLedgerByReceipt("1");

    expect(api.get).toHaveBeenCalledWith(
      "/ledger/receipt/1"
    );
  });

  it("getUserBalance", async () => {
    api.get = mock(async () =>
      axiosResponse({ net_cents: 0 })
    ) as unknown as typeof api.get;

    await getUserBalance("u1");

    expect(api.get).toHaveBeenCalledWith(
      "/ledger/user/u1/balance"
    );
  });

  it("settleLedgerEntry", async () => {
    api.post = mock(async () =>
      axiosResponse({})
    ) as unknown as typeof api.post;

    await settleLedgerEntry("e1", 500);

    expect(api.post).toHaveBeenCalledWith(
      "/ledger/e1/settle",
      { amount_cents: 500 }
    );
  });

  it("deleteLedgerForReceipt", async () => {
    api.delete = mock(async () =>
      axiosResponse({ deleted_count: 1 })
    ) as unknown as typeof api.delete;

    await deleteLedgerForReceipt("1");

    expect(api.delete).toHaveBeenCalledWith(
      "/ledger/receipt/1"
    );
  });
});