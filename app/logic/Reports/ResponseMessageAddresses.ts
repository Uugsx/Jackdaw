import { appGlobal } from "../app";

/** Возвращает адреса, которыми владеют подключённые почтовые аккаунты. */
export function getConfiguredMailAddresses(
  accountId: number | null = null,
): string[] {
  const addresses: string[] = [];
  for (const account of appGlobal.emailAccounts) {
    if (accountId != null && Number(account.dbID) != accountId) {
      continue;
    }
    addresses.push(account.emailAddress);
    for (const identity of account.identities) {
      addresses.push(identity.emailAddress);
    }
  }
  return normalizeMailAddresses(addresses);
}

/** Нормализует адреса для сопоставления без учёта регистра и пробелов. */
export function normalizeMailAddresses(value: readonly unknown[]): string[] {
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item == "string")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

/** Возвращает домены нормализованных почтовых адресов. */
export function mailAddressDomains(addresses: readonly string[]): string[] {
  return [
    ...new Set(
      addresses
        .map((address) => {
          const atIndex = address.lastIndexOf("@");
          return atIndex > 0 ? address.slice(atIndex + 1) : "";
        })
        .filter(Boolean),
    ),
  ];
}
