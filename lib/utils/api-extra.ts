export * from "@/lib/utils/api";

export function badRequestOr(message: string) {
  return Object.assign(new Error(message), {
    code: "BAD_REQUEST",
    status: 400,
    message,
  });
}
